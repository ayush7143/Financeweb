const ss = require('simple-statistics');

class ExpenseForecasting {
    forecast(historicalData, months = 3) {
        // Check for sufficient data
        if (!historicalData || historicalData.length < 6) {
            return this.basicForecast(historicalData, months);
        }
        
        try {
            // Group expenses by month and category
            const monthlyData = this.aggregateMonthlyData(historicalData);
            const categorizedData = this.aggregateByCategoryAndMonth(historicalData);
            
            // Detect seasonality patterns
            const seasonalityDetected = this.detectSeasonality(monthlyData);
            
            // Determine outliers and remove them
            const cleanedMonthlyData = this.removeOutliers(monthlyData);
            
            // Prepare data for forecasting
            const totalForecast = this.generateTotalForecast(cleanedMonthlyData, months, seasonalityDetected);
            const categoryForecasts = this.generateCategoryForecasts(categorizedData, months);
            
            // Calculate overall confidence score
            const confidenceScore = this.calculateOverallConfidence(totalForecast.confidence, categoryForecasts);
            
            return {
                forecast: totalForecast.forecast,
                categoryForecasts: categoryForecasts.map(cf => cf.forecast),
                confidence: confidenceScore,
                seasonalityDetected,
                methodology: seasonalityDetected ? 'seasonal-adjusted' : 'linear-regression'
            };
        } catch (error) {
            console.error('Advanced forecasting failed, falling back to basic forecast', error);
            return this.basicForecast(historicalData, months);
        }
    }
    
    // Basic forecast method as fallback
    basicForecast(historicalData, months = 3) {
        // Group expenses by month
        const monthlyTotals = this.aggregateMonthlyData(historicalData);
        
        // Convert to arrays for regression
        const points = Object.entries(monthlyTotals).map(([month, total], index) => [index, total]);
        
        // Calculate linear regression
        let regression;
        try {
            regression = ss.linearRegression(points);
        } catch (error) {
            // If regression fails (e.g., not enough points), use average
            const average = points.length > 0 
                ? points.reduce((sum, point) => sum + point[1], 0) / points.length 
                : 1000; // Default amount if no data
            
            regression = { m: 0, b: average };
        }
        
        // Generate forecast
        const forecast = [];
        const lastMonth = Math.max(0, points.length - 1);
        
        for (let i = 1; i <= months; i++) {
            const predictedAmount = regression.m * (lastMonth + i) + regression.b;
            forecast.push({
                month: this.getNextMonth(i),
                amount: Math.max(0, Math.round(predictedAmount * 100) / 100)
            });
        }

        return {
            forecast,
            confidence: points.length > 2 ? this.calculateConfidence(points, regression) : 50,
            methodology: 'basic-linear'
        };
    }
    
    // Detect seasonal patterns in the data
    detectSeasonality(monthlyData) {
        // Need at least 12 months of data for seasonality
        const months = Object.keys(monthlyData);
        if (months.length < 12) {
            return false;
        }
        
        // Convert to array for autocorrelation
        const values = Object.values(monthlyData);
        
        // Calculate autocorrelation at lag 12 (annual seasonality)
        const autocorrelation = this.calculateAutocorrelation(values, 12);
        
        // If autocorrelation is above 0.4, consider it seasonal
        return autocorrelation > 0.4;
    }
    
    // Calculate autocorrelation for seasonality detection
    calculateAutocorrelation(data, lag) {
        if (data.length <= lag) {
            return 0;
        }
        
        const n = data.length;
        const mean = data.reduce((a, b) => a + b, 0) / n;
        
        // Calculate variance
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        if (variance === 0) return 0;
        
        // Calculate autocorrelation
        let autocorr = 0;
        for (let i = 0; i < n - lag; i++) {
            autocorr += (data[i] - mean) * (data[i + lag] - mean);
        }
        
        return autocorr / ((n - lag) * variance);
    }
    
    // Remove outliers from monthly data
    removeOutliers(monthlyData) {
        const values = Object.values(monthlyData);
        if (values.length < 4) return monthlyData; // Not enough data to detect outliers
        
        const q1 = ss.quantile(values, 0.25);
        const q3 = ss.quantile(values, 0.75);
        const iqr = q3 - q1;
        const upperBound = q3 + (1.5 * iqr);
        const lowerBound = Math.max(0, q1 - (1.5 * iqr));
        
        // Filter out outliers
        const cleanedData = {};
        Object.entries(monthlyData).forEach(([month, value]) => {
            if (value >= lowerBound && value <= upperBound) {
                cleanedData[month] = value;
            } else {
                // Replace outliers with median value
                cleanedData[month] = ss.median(values);
            }
        });
        
        return cleanedData;
    }
    
    // Generate forecast for total expenses
    generateTotalForecast(monthlyData, months, useSeasonality) {
        const points = Object.entries(monthlyData).map(([month, total], index) => [index, total]);
        
        // Apply appropriate forecasting model
        let forecast = [];
        let confidence = 50;
        
        if (useSeasonality && points.length >= 12) {
            // Use seasonal model
            forecast = this.seasonalForecast(points, months);
            confidence = 70; // Seasonal models typically have higher confidence
        } else {
            // Use linear regression
            const regression = ss.linearRegression(points);
            const lastMonth = points.length - 1;
            
            for (let i = 1; i <= months; i++) {
                const predictedAmount = regression.m * (lastMonth + i) + regression.b;
                forecast.push({
                    month: this.getNextMonth(i),
                    amount: Math.max(0, Math.round(predictedAmount * 100) / 100)
                });
            }
            
            confidence = this.calculateConfidence(points, regression);
        }
        
        return { forecast, confidence };
    }
    
    // Generate seasonal forecast using last year's pattern with trend
    seasonalForecast(points, months) {
        // Extract the trend component
        const regression = ss.linearRegression(points);
        
        // Calculate seasonal factors (monthly ratios to the trend)
        const seasonalFactors = [];
        for (let i = 0; i < 12 && i < points.length; i++) {
            const trend = regression.m * i + regression.b;
            if (trend > 0) {
                seasonalFactors[i] = points[i][1] / trend;
            } else {
                seasonalFactors[i] = 1;
            }
        }
        
        // Fill in missing seasonal factors with 1 (neutral)
        while (seasonalFactors.length < 12) {
            seasonalFactors.push(1);
        }
        
        // Generate forecast
        const forecast = [];
        const lastMonth = points.length - 1;
        
        for (let i = 1; i <= months; i++) {
            const monthIndex = (new Date().getMonth() + i) % 12;
            const trendPrediction = regression.m * (lastMonth + i) + regression.b;
            const seasonalFactor = seasonalFactors[monthIndex];
            
            forecast.push({
                month: this.getNextMonth(i),
                amount: Math.max(0, Math.round(trendPrediction * seasonalFactor * 100) / 100)
            });
        }
        
        return forecast;
    }
    
    // Generate category-specific forecasts
    generateCategoryForecasts(categorizedData, months) {
        const categoryForecasts = [];
        
        Object.entries(categorizedData).forEach(([category, monthlyData]) => {
            const points = Object.entries(monthlyData)
                .map(([month, total], index) => [index, total]);
            
            // Only forecast if we have enough data points
            if (points.length >= 3) {
                try {
                    const regression = ss.linearRegression(points);
                    const lastMonth = points.length - 1;
                    const forecast = [];
                    
                    for (let i = 1; i <= months; i++) {
                        const predictedAmount = regression.m * (lastMonth + i) + regression.b;
                        forecast.push({
                            month: this.getNextMonth(i),
                            category,
                            amount: Math.max(0, Math.round(predictedAmount * 100) / 100)
                        });
                    }
                    
                    const confidence = this.calculateConfidence(points, regression);
                    
                    categoryForecasts.push({
                        category,
                        forecast,
                        confidence
                    });
                } catch (error) {
                    console.warn(`Failed to generate forecast for category ${category}:`, error);
                }
            }
        });
        
        return categoryForecasts;
    }

    // Aggregate historical data by month
    aggregateMonthlyData(data) {
        return data.reduce((acc, expense) => {
            try {
                const date = new Date(expense.date || expense.paymentDate || expense.invoiceDate);
                if (isNaN(date.getTime())) return acc;
                
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const amount = parseFloat(expense.amount || expense.amountPaid || expense.salary || expense.amountInclGST || 0);
                
                if (!isNaN(amount)) {
                    acc[monthKey] = (acc[monthKey] || 0) + amount;
                }
            } catch (error) {
                console.warn('Error processing expense for monthly aggregation:', error);
            }
            return acc;
        }, {});
    }
    
    // Aggregate data by category and month
    aggregateByCategoryAndMonth(data) {
        const categorizedMonthly = {};
        
        data.forEach(expense => {
            try {
                const date = new Date(expense.date || expense.paymentDate || expense.invoiceDate);
                if (isNaN(date.getTime())) return;
                
                const category = expense.suggestedCategory || expense.category || 'Miscellaneous';
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const amount = parseFloat(expense.amount || expense.amountPaid || expense.salary || expense.amountInclGST || 0);
                
                if (!isNaN(amount)) {
                    if (!categorizedMonthly[category]) {
                        categorizedMonthly[category] = {};
                    }
                    
                    categorizedMonthly[category][monthKey] = (categorizedMonthly[category][monthKey] || 0) + amount;
                }
            } catch (error) {
                console.warn('Error processing expense for category aggregation:', error);
            }
        });
        
        return categorizedMonthly;
    }

    // Get next month in ISO format
    getNextMonth(monthsAhead) {
        const date = new Date();
        date.setMonth(date.getMonth() + monthsAhead);
        return date.toISOString().slice(0, 7);
    }

    // Calculate confidence based on R-squared
    calculateConfidence(points, regression) {
        try {
            if (points.length < 3) return 50; // Default for limited data
            
            const rSquared = ss.rSquared(
                points,
                points.map(point => regression.m * point[0] + regression.b)
            );
            
            // Scale R-squared to a 0-100 confidence percentage
            return Math.min(100, Math.max(0, Math.round(rSquared * 100)));
        } catch (error) {
            console.warn('Error calculating confidence:', error);
            return 50; // Default confidence
        }
    }
    
    // Calculate overall confidence from multiple forecasts
    calculateOverallConfidence(totalConfidence, categoryForecasts) {
        if (categoryForecasts.length === 0) return totalConfidence;
        
        // Weight the total forecast more heavily (70%)
        const categoryConfidenceAvg = categoryForecasts.reduce(
            (sum, cf) => sum + cf.confidence, 
            0
        ) / categoryForecasts.length;
        
        return Math.round((totalConfidence * 0.7) + (categoryConfidenceAvg * 0.3));
    }
}

module.exports = new ExpenseForecasting(); 