const excelService = require('../services/excelService');
const EmployeeExpense = require('../models/EmployeeExpense');
const SalaryExpense = require('../models/SalaryExpense');
const VendorPayment = require('../models/VendorPayment');
const Income = require('../models/Income');

const handleExcelUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const parsedData = excelService.parseExcel(req.file.buffer);
        const results = { success: [], errors: [] };

        // Get the data type from request
        const dataType = req.body.dataType;
        
        if (!dataType) {
            return res.status(400).json({ error: 'Data type is required' });
        }

        // Process each sheet
        for (const [sheetName, data] of Object.entries(parsedData)) {
            if (!data.length) continue;

            // Determine model based on dataType
            let Model;
            switch (dataType) {
                case 'employee':
                    Model = EmployeeExpense;
                    break;
                case 'salary':
                    Model = SalaryExpense;
                    break;
                case 'vendor':
                    Model = VendorPayment;
                    break;
                case 'income':
                    Model = Income;
                    break;
                default:
                    return res.status(400).json({ error: `Invalid data type: ${dataType}` });
            }

            try {
                // Validate data
                if (excelService.validateData(data, Model.modelName)) {
                    await Model.insertMany(data);
                    results.success.push(`Successfully imported ${data.length} records to ${Model.modelName}`);
                } else {
                    results.errors.push(`Invalid data format in ${sheetName}`);
                }
            } catch (error) {
                console.error(`Error processing sheet ${sheetName}:`, error);
                results.errors.push(`Error processing sheet ${sheetName}: ${error.message}`);
            }
        }

        if (results.errors.length > 0) {
            return res.status(400).json(results);
        }

        res.json(results);

    } catch (error) {
        console.error('Excel upload error:', error);
        res.status(500).json({ 
            error: 'Error processing Excel file',
            details: error.message 
        });
    }
};

module.exports = {
    handleExcelUpload
};
