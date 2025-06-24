const xlsx = require('xlsx');

class ExcelService {
    parseExcel(buffer) {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const result = {};

        // Parse each sheet
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);
            
            // Clean and validate data
            const cleanData = data.map(row => {
                // Map Excel columns to model fields
                const mappedRow = {
                    employeeName: row['Employee Name'] || row['employeeName'],
                    expenseType: row['Category'] || row['Expense Type'] || row['expenseType'],
                    amountPaid: Number(row['Amount Paid'] || row['Amount'] || row['amountPaid'] || 0),
                    date: this._parseExcelDate(row['Date'] || row['date']),
                    status: (row['Status'] || row['status'] || 'Pending').toLowerCase(),
                    remarks: row['Description'] || row['Remarks'] || row['remarks'] || ''
                };

                // Validate date
                if (!(mappedRow.date instanceof Date) || isNaN(mappedRow.date.getTime())) {
                    console.warn(`Invalid date found in row: ${JSON.stringify(row)}`);
                    mappedRow.date = new Date(); // Set to current date if invalid
                }

                return mappedRow;
            });

            result[sheetName] = cleanData;
        });

        return result;
    }

    _parseExcelDate(dateValue) {
        if (!dateValue) return new Date();

        // Handle Excel serial number dates
        if (typeof dateValue === 'number') {
            // Excel date serial number (days since 1900-01-01)
            const excelEpoch = new Date(1900, 0, 1);
            const days = dateValue - 1; // Excel starts counting from 1
            return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
        }

        // Handle string dates
        if (typeof dateValue === 'string') {
            // Try different date formats
            const formats = [
                'yyyy-mm-dd',
                'mm/dd/yyyy',
                'dd/mm/yyyy',
                'yyyy/mm/dd'
            ];

            for (const format of formats) {
                const date = this._parseDateString(dateValue, format);
                if (date && !isNaN(date.getTime())) {
                    return date;
                }
            }
        }

        // If all parsing attempts fail, return current date
        return new Date();
    }

    _parseDateString(dateStr, format) {
        const parts = dateStr.split(/[-/]/);
        if (parts.length !== 3) return null;

        let year, month, day;

        if (format === 'yyyy-mm-dd') {
            [year, month, day] = parts;
        } else if (format === 'mm/dd/yyyy') {
            [month, day, year] = parts;
        } else if (format === 'dd/mm/yyyy') {
            [day, month, year] = parts;
        } else if (format === 'yyyy/mm/dd') {
            [year, month, day] = parts;
        }

        // Convert to numbers and adjust month (0-based)
        year = parseInt(year);
        month = parseInt(month) - 1;
        day = parseInt(day);

        // Validate date components
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        if (month < 0 || month > 11) return null;
        if (day < 1 || day > 31) return null;

        return new Date(year, month, day);
    }

    validateData(data, type) {
        const validators = {
            EmployeeExpense: row => row.employeeName && row.expenseType && row.amountPaid && row.date,
            SalaryExpense: row => row.employeeName && row.department && row.salary && row.paymentDate,
            VendorPayment: row => row.vendorName && row.invoiceNumber && row.amount && row.paymentDate,
            Income: row => row.source && row.amount && row.date && row.category
        };

        return data.every(validators[type] || (() => false));
    }
}

module.exports = new ExcelService();
