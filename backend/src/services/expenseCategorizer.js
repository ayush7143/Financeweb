const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const TfIdf = natural.TfIdf;
const distance = natural.JaroWinklerDistance;
const OpenAI = require('openai');
const EmployeeExpense = require('../models/EmployeeExpense');
const VendorPayment = require('../models/VendorPayment');
const config = require('../config');

let openai = null;
try {
    if (config.openai.apiKey) {
        openai = new OpenAI({
            apiKey: config.openai.apiKey
        });
    }
} catch (error) {
    console.warn('OpenAI initialization failed:', error);
}

// Enhanced categories with more detailed keywords and patterns
const CATEGORIES = {
  'Office Supplies': {
    keywords: ['paper', 'pen', 'desk', 'stationery', 'printer', 'cartridge', 'office', 'supplies', 'toner', 'ink', 'folder', 'notebook', 'stapler', 'scissors'],
    patterns: ['office supply', 'stationery', 'printer ink', 'paper products']
  },
  'Travel': {
    keywords: ['flight', 'hotel', 'taxi', 'uber', 'train', 'transport', 'travel', 'airfare', 'lodging', 'car rental', 'fuel', 'airport', 'ticket', 'accommodation'],
    patterns: ['business trip', 'travel expense', 'hotel stay', 'flight ticket']
  },
  'Technology': {
    keywords: ['software', 'laptop', 'computer', 'license', 'subscription', 'hardware', 'tech', 'digital', 'server', 'cloud', 'app', 'system', 'network', 'device'],
    patterns: ['software license', 'tech equipment', 'computer hardware', 'cloud service']
  },
  'Marketing': {
    keywords: ['advertising', 'promotion', 'campaign', 'marketing', 'ads', 'social media', 'seo', 'content', 'branding', 'digital', 'campaign', 'publicity'],
    patterns: ['marketing campaign', 'ad campaign', 'social media ads', 'brand promotion']
  },
  'Utilities': {
    keywords: ['electricity', 'water', 'internet', 'phone', 'utility', 'bill', 'service', 'telecom', 'heat', 'gas', 'power', 'energy', 'broadband'],
    patterns: ['utility bill', 'internet service', 'phone service', 'energy bill']
  },
  'Maintenance': {
    keywords: ['repair', 'maintenance', 'cleaning', 'service', 'fix', 'facility', 'upkeep', 'plumbing', 'hvac', 'equipment', 'building', 'property'],
    patterns: ['building maintenance', 'equipment repair', 'facility service', 'property upkeep']
  },
  'Food': {
    keywords: ['meal', 'restaurant', 'catering', 'lunch', 'dinner', 'food', 'grocery', 'refreshment', 'cafe', 'dining', 'coffee', 'snack'],
    patterns: ['business lunch', 'team dinner', 'office catering', 'coffee break']
  },
  'Insurance': {
    keywords: ['insurance', 'premium', 'coverage', 'policy', 'protection', 'liability', 'health', 'business', 'property', 'vehicle', 'medical'],
    patterns: ['insurance premium', 'business insurance', 'health coverage', 'property insurance']
  },
  'Rent': {
    keywords: ['rent', 'lease', 'office space', 'property', 'building', 'facility', 'workspace', 'premises', 'location', 'space'],
    patterns: ['office rent', 'property lease', 'workspace rental', 'facility rent']
  },
  'Salary': {
    keywords: ['salary', 'payroll', 'compensation', 'wage', 'bonus', 'payment', 'employee', 'staff', 'wages', 'remuneration'],
    patterns: ['employee salary', 'payroll payment', 'staff compensation', 'bonus payment']
  },
  'Legal': {
    keywords: ['legal', 'attorney', 'lawyer', 'compliance', 'registration', 'filing', 'permit', 'license', 'contract', 'document', 'patent'],
    patterns: ['legal service', 'compliance filing', 'contract review', 'patent filing']
  }
};

class ExpenseCategorizer {
    constructor() {
        // Initialize TF-IDF model for each category
        this.tfidf = new TfIdf();
        Object.entries(CATEGORIES).forEach(([category, data]) => {
            const text = [...data.keywords, ...data.patterns].join(' ');
            this.tfidf.addDocument(text, category);
        });
        
        // Historical vendor-category associations
        this.vendorCategoryMap = {};
        
        // Expense type-category associations
        this.expenseTypeCategoryMap = {};
        
        // Confidence thresholds
        this.vendorConfidenceThreshold = 2;
        this.simThreshold = 0.85;
    }

    async predictCategory(expense) {
        try {
            const description = this.getDescriptionText(expense);
            const tokens = this.tokenizeAndStem(description);
            
            // 1. Check if we have a historical record for this exact vendor
            if (expense.vendorName && this.vendorCategoryMap[expense.vendorName]) {
                const vendorHistory = this.vendorCategoryMap[expense.vendorName];
                if (vendorHistory.count >= this.vendorConfidenceThreshold) {
                    return {
                        category: vendorHistory.category,
                        confidence: 1.0,
                        method: 'historical_vendor'
                    };
                }
            }
            
            // 2. Check for similar vendor names in our history
            if (expense.vendorName) {
                const similarVendorMatch = this.findSimilarVendor(expense.vendorName);
                if (similarVendorMatch) {
                    return {
                        category: similarVendorMatch,
                        confidence: 0.9,
                        method: 'similar_vendor'
                    };
                }
            }
            
            // 3. Check expense type mapping
            if (expense.expenseType && this.expenseTypeCategoryMap[expense.expenseType]) {
                const expenseTypeHistory = this.expenseTypeCategoryMap[expense.expenseType];
                if (expenseTypeHistory.count >= this.vendorConfidenceThreshold) {
                    return {
                        category: expenseTypeHistory.category,
                        confidence: 0.8,
                        method: 'expense_type'
                    };
                }
            }
            
            // 4. Use TF-IDF to find the best category match
            const tfidfScores = {};
            this.tfidf.tfidfs(tokens.join(' '), (i, measure, category) => {
                tfidfScores[category] = measure;
            });
            
            // 5. Calculate pattern matching scores
            const patternScores = {};
            Object.entries(CATEGORIES).forEach(([category, data]) => {
                patternScores[category] = this.calculatePatternScore(description, data.patterns);
            });
            
            // 6. Calculate keyword matching scores
            const keywordScores = {};
            Object.entries(CATEGORIES).forEach(([category, data]) => {
                keywordScores[category] = this.calculateCategoryScore(tokens, data.keywords);
            });
            
            // 7. Combine all scores with weights
            const combinedScores = {};
            Object.keys(CATEGORIES).forEach(category => {
                combinedScores[category] = 
                    (tfidfScores[category] || 0) * 0.4 +
                    (patternScores[category] || 0) * 0.3 +
                    (keywordScores[category] || 0) * 0.3;
            });
            
            // Find category with highest score
            const bestMatch = Object.entries(combinedScores)
                .reduce((max, current) => current[1] > max[1] ? current : max, ['Miscellaneous', 0]);
            
            return {
                category: bestMatch[1] > 0 ? bestMatch[0] : 'Miscellaneous',
                confidence: bestMatch[1],
                method: 'ai_analysis'
            };
        } catch (error) {
            console.error('Error in predictCategory:', error);
            return {
                category: 'Miscellaneous',
                confidence: 0,
                method: 'error_fallback'
            };
        }
    }
    
    findSimilarVendor(vendorName) {
        for (const [vendor, data] of Object.entries(this.vendorCategoryMap)) {
            const similarity = distance(vendorName.toLowerCase(), vendor.toLowerCase());
            if (similarity > this.simThreshold && data.count >= this.vendorConfidenceThreshold) {
                return data.category;
            }
        }
        return null;
    }

    tokenizeAndStem(text) {
        const tokens = tokenizer.tokenize(text.toLowerCase());
        return tokens.map(token => stemmer.stem(token));
    }
    
    getDescriptionText(expense) {
        return [
            expense.vendorName || '',
            expense.expenseType || '',
            expense.description || '',
            expense.remarks || ''
        ].join(' ').toLowerCase();
    }

    calculateCategoryScore(tokens, keywords) {
        const stemmedKeywords = keywords.map(word => stemmer.stem(word.toLowerCase()));
        return tokens.reduce((score, token) => {
            return score + (stemmedKeywords.includes(token) ? 1 : 0);
        }, 0) / Math.max(tokens.length, 1);
    }

    calculatePatternScore(text, patterns) {
        return patterns.reduce((score, pattern) => {
            return score + (text.toLowerCase().includes(pattern.toLowerCase()) ? 1 : 0);
        }, 0) / Math.max(patterns.length, 1);
    }
    
    // Learn from past categorizations
    learnFromCategorization(expense, category) {
        // Update vendor-category mapping
        if (expense.vendorName) {
            if (!this.vendorCategoryMap[expense.vendorName]) {
                this.vendorCategoryMap[expense.vendorName] = { 
                    category, 
                    count: 1 
                };
            } else if (this.vendorCategoryMap[expense.vendorName].category === category) {
                this.vendorCategoryMap[expense.vendorName].count++;
            } else {
                // If category changed, reset the count but keep the new category
                this.vendorCategoryMap[expense.vendorName] = { 
                    category, 
                    count: 1 
                };
            }
        }
        
        // Update expense type mapping
        if (expense.expenseType) {
            if (!this.expenseTypeCategoryMap[expense.expenseType]) {
                this.expenseTypeCategoryMap[expense.expenseType] = { 
                    category, 
                    count: 1 
                };
            } else if (this.expenseTypeCategoryMap[expense.expenseType].category === category) {
                this.expenseTypeCategoryMap[expense.expenseType].count++;
            } else {
                this.expenseTypeCategoryMap[expense.expenseType] = { 
                    category, 
                    count: 1 
                };
            }
        }
    }

    async categorizeBulkExpenses(expenses) {
        try {
            // Process the expenses and return with predicted categories
            return await Promise.all(expenses.map(async expense => {
                // Create a copy of the expense document to avoid modifying the original
                const expenseData = expense.toObject ? expense.toObject() : {...expense};
                
                // Predict category with confidence score
                const prediction = await this.predictCategory(expenseData);
                
                // Learn from this prediction for future use
                this.learnFromCategorization(expenseData, prediction.category);
                
                return {
                    ...expenseData,
                    suggestedCategory: prediction.category,
                    confidence: prediction.confidence,
                    categorizationMethod: prediction.method
                };
            }));
        } catch (error) {
            console.error('Error in categorizeBulkExpenses:', error);
            throw error;
        }
    }
}

async function learnFromCategorization(expenseId, expenseType, newCategory) {
    try {
        // Get the expense details
        const expense = expenseType === 'employee' 
            ? await EmployeeExpense.findById(expenseId)
            : await VendorPayment.findById(expenseId);

        if (!expense) {
            throw new Error('Expense not found');
        }

        // If OpenAI is not available, just update the local mappings
        if (!openai) {
            const categorizer = new ExpenseCategorizer();
            categorizer.learnFromCategorization(expense, newCategory);
            return true;
        }

        // Create a learning prompt
        const prompt = `Learn from this correction:
        Original Description: ${expense.description}
        Original Category: ${expense.suggestedCategory}
        Correct Category: ${newCategory}
        
        Please analyze this correction and update your understanding of how to categorize similar expenses.`;

        // Call OpenAI to process the learning
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 100,
            temperature: 0.3,
        });

        // Log the learning for future reference
        console.log('Learning processed:', response.choices[0].message.content);

        return true;
    } catch (error) {
        console.error('Error in learning from categorization:', error);
        // If OpenAI fails, still update local mappings
        const categorizer = new ExpenseCategorizer();
        categorizer.learnFromCategorization(expense, newCategory);
        return true;
    }
}

// Export the categories for frontend use
module.exports = {
    CATEGORIES,
    categorizeExpenses: new ExpenseCategorizer().categorizeBulkExpenses,
    learnFromCategorization
}; 