const Income = require('../models/Income');
const EmployeeExpense = require('../models/EmployeeExpense');
const SalaryExpense = require('../models/SalaryExpense');
const VendorPayment = require('../models/VendorPayment');

const getProfitLossReport = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const timeframe = req.query.timeframe || 'monthly';
        
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);

        // Get all financial data for the year
        const [incomes, employeeExpenses, salaryExpenses, vendorPayments] = await Promise.all([
            Income.find({
                date: { $gte: startDate, $lte: endDate }
            }),
            EmployeeExpense.find({
                date: { $gte: startDate, $lte: endDate }
            }),
            SalaryExpense.find({
                paymentDate: { $gte: startDate, $lte: endDate }
            }),
            VendorPayment.find({
                paymentDate: { $gte: startDate, $lte: endDate }
            })
        ]);

        // Month names for formatting response
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Initialize monthly data structure
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            name: monthNames[i],
            income: 0,
            expenses: 0,
            profit: 0
        }));

        // Aggregate income
        incomes.forEach(income => {
            const month = new Date(income.date).getMonth();
            monthlyData[month].income += income.amount;
        });

        // Aggregate expenses
        const aggregateExpenses = (items, dateField) => {
            items.forEach(item => {
                const month = new Date(item[dateField]).getMonth();
                monthlyData[month].expenses += item.amount || item.salary;
            });
        };

        aggregateExpenses(employeeExpenses, 'date');
        aggregateExpenses(salaryExpenses, 'paymentDate');
        aggregateExpenses(vendorPayments, 'paymentDate');

        // Calculate profit for each month
        monthlyData.forEach(data => {
            data.profit = data.income - data.expenses;
        });

        // Format data based on timeframe
        let responseData;
        if (timeframe === 'quarterly') {
            // Group by quarters
            responseData = [
                { name: 'Q1', income: 0, expenses: 0, profit: 0 },
                { name: 'Q2', income: 0, expenses: 0, profit: 0 },
                { name: 'Q3', income: 0, expenses: 0, profit: 0 },
                { name: 'Q4', income: 0, expenses: 0, profit: 0 }
            ];
            
            monthlyData.forEach((data, index) => {
                const quarter = Math.floor(index / 3);
                responseData[quarter].income += data.income;
                responseData[quarter].expenses += data.expenses;
                responseData[quarter].profit += data.profit;
            });
        } else {
            // Monthly data (default)
            responseData = monthlyData.map(data => ({
                name: data.name,
                income: data.income,
                expenses: data.expenses,
                profit: data.profit
            }));
        }

        // Send direct array to match frontend expectations
        res.json(responseData);

    } catch (error) {
        console.error('Error generating P&L report:', error);
        res.status(500).json([]);  // Return empty array on error to match frontend expectations
    }
};

module.exports = {
    getProfitLossReport
};
