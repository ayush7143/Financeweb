const { OpenAI } = require("openai");
const EmployeeExpense = require("../models/EmployeeExpense");
const SalaryExpense = require("../models/SalaryExpense");
const VendorPayment = require("../models/VendorPayment");
const Income = require("../models/Income");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper: Summarize financials
async function getFinancialSummary() {
  const [employee, salary, vendor, income] = await Promise.all([
    EmployeeExpense.find({}),
    SalaryExpense.find({}),
    VendorPayment.find({}),
    Income.find({})
  ]);
  const totalEmployee = employee.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
  const totalSalary = salary.reduce((sum, s) => sum + (s.amountPaid || s.amount || 0), 0);
  const totalVendor = vendor.reduce((sum, v) => sum + (v.amountInclGST || v.amount || 0), 0);
  const totalIncome = income.reduce((sum, i) => sum + (i.amountReceived || 0), 0);
  const totalExpenses = totalEmployee + totalSalary + totalVendor;
  const netProfit = totalIncome - totalExpenses;
  return {
    totalIncome, totalExpenses, netProfit,
    employee, salary, vendor, income
  };
}

// POST /api/ai/ask
exports.askAI = async (req, res) => {
  try {
    const isStream = req.method === 'GET' || req.query.stream === 'true';
    const message = isStream ? req.query.message : req.body.message;
    let history = isStream ? req.query.history : req.body.history;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Missing or invalid message in request.' });
    }
    if (typeof history === 'string') {
      try { history = JSON.parse(history); } catch { history = []; }
    }
    if (!Array.isArray(history)) history = [];

    // Always get the latest summary
    const summary = await getFinancialSummary();

    // Compose context for the AI
    // Add more dynamic and detailed context for better answers
    const recentEmployee = summary.employee.slice(-3).map(e => `- ${e.description || e.purpose || 'Expense'}: ₹${e.amountPaid || 0} on ${e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}`).join('\n');
    const recentVendor = summary.vendor.slice(-3).map(v => `- ${v.vendorName || 'Vendor'}: ₹${v.amountInclGST || v.amount || 0} on ${v.date ? new Date(v.date).toLocaleDateString() : 'N/A'}`).join('\n');
    const recentSalary = summary.salary.slice(-3).map(s => `- ${s.employeeName || 'Employee'}: ₹${s.amountPaid || s.amount || 0} on ${s.date ? new Date(s.date).toLocaleDateString() : 'N/A'}`).join('\n');
    const recentIncome = summary.income.slice(-3).map(i => `- ${i.source || 'Income'}: ₹${i.amountReceived || 0} on ${i.date ? new Date(i.date).toLocaleDateString() : 'N/A'}`).join('\n');

    const systemPrompt = `
You are a smart, helpful financial assistant for a business user. Use the following up-to-date summary and recent transactions to answer questions, provide insights, and suggest actions. Be concise, clear, and insightful. If the user asks for details, use the data below.

Financial Summary:
- Total Income: ₹${summary.totalIncome}
- Total Expenses: ₹${summary.totalExpenses}
- Net Profit: ₹${summary.netProfit}

Recent Employee Expenses:
${recentEmployee || 'None'}
Recent Vendor Payments:
${recentVendor || 'None'}
Recent Salary Expenses:
${recentSalary || 'None'}
Recent Income Entries:
${recentIncome || 'None'}
`;

    // Prepare messages for OpenAI
    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message }
    ];

    if (isStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.flushHeaders();

      try {
        const stream = await openai.chat.completions.create({
  model: "gpt-3.5-turbo", // <-- change here
  messages,
  stream: true,
});
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${content}\n\n`);
          }
        }
        res.write("event: done\ndata: [DONE]\n\n");
        res.end();
      } catch (streamErr) {
        if (!res.headersSent) {
          res.status(500).json({ error: streamErr.message });
        } else {
          // If headers already sent, just end the stream
          res.write("event: error\ndata: [ERROR]\n\n");
          res.end();
        }
      }
    } else {
      // Non-streaming response
      const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo", // <-- change here
  messages,
  max_tokens: 512,
  temperature: 0.2,
});
      res.json({ answer: completion.choices[0].message.content });
    }
  } catch (err) {
    // Enhanced error logging for debugging
    console.error('AI Controller Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message, details: err.stack });
    } // else: do nothing, response already sent
  }
};

// GET/POST /api/ai/categorization
exports.categorizeExpenses = async (req, res) => {
  // Placeholder: implement actual categorization logic or call service
  res.json({ message: "Expense categorization endpoint (not yet implemented)" });
};

// GET /api/ai/forecast
exports.getForecast = async (req, res) => {
  // Placeholder: implement actual forecasting logic or call service
  res.json({ message: "Expense forecasting endpoint (not yet implemented)" });
};

// PUT /api/ai/categorization
exports.updateCategorization = async (req, res) => {
  // Placeholder: implement actual update logic
  res.json({ message: "Update categorization endpoint (not yet implemented)" });
};