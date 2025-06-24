import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpTrayIcon, DocumentTextIcon, CheckBadgeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { excelApi } from '../api/apiService';

const ExcelUpload = () => {
  const [file, setFile] = useState(null);
  const [dataType, setDataType] = useState('employee');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [isDragging, setIsDragging] = useState(false);
  
  const dataTypes = [
    { 
      id: 'employee', 
      name: 'Employee Expense',
      requiredColumns: ['Date', 'Employee Name', 'Category', 'Description', 'Amount Paid', 'Status']
    },
    { 
      id: 'salary', 
      name: 'Salary Expense',
      requiredColumns: ['Date', 'Employee Name', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Payment Status']
    },
    { 
      id: 'vendor', 
      name: 'Vendor Payment',
      requiredColumns: ['Invoice Date', 'Vendor Name', 'GST Number', 'Invoice Number', 'Amount', 'Tax Amount', 'Total Amount', 'Payment Status']
    },
    { 
      id: 'income', 
      name: 'Income Entry',
      requiredColumns: ['Date', 'Source', 'Category', 'Amount Received', 'Payment Mode', 'Reference Number']
    }
  ];
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateFile(selectedFile);
    }
  };
  
  const validateFile = (file) => {
    // Check if file is Excel
    const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (!validTypes.includes(file.type)) {
      setUploadStatus({
        type: 'error',
        message: 'Please upload Excel files only (.xls or .xlsx)'
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({
        type: 'error',
        message: 'File size exceeds 5MB limit'
      });
      return;
    }
    
    setFile(file);
    setUploadStatus({ type: '', message: '' });
  };
  
  const validateFileContent = async (file) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      // Here you would implement XLSX parsing logic
      // For now, we'll just validate the file type
      const selectedDataType = dataTypes.find(type => type.id === dataType);
      // You would check if the Excel columns match the required columns
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a file to upload'
      });
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataType', dataType);
    
    try {
      const response = await excelApi.upload(formData);
      
      if (response.status === 200) {
        setUploadStatus({
          type: 'success',
          message: `Successfully uploaded and processed ${file.name}`
        });
        setFile(null);
      }
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.message || 'Error uploading file. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Excel Data Upload</h1>
      
      <motion.div 
        className="bg-white rounded-lg shadow-sm p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {uploadStatus.message && (
          <div className={`mb-6 p-4 rounded-md ${
            uploadStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <div className="flex items-center">
              {uploadStatus.type === 'success' ? (
                <CheckBadgeIcon className="w-5 h-5 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              )}
              <span>{uploadStatus.message}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="dataType" className="block text-sm font-medium text-gray-700 mb-1">
              Data Type
            </label>
            <select
              id="dataType"
              name="dataType"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
            >
              {dataTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Select the type of data you are uploading
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Excel File
            </label>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
              } transition-smooth cursor-pointer`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('file-upload').click()}
            >
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileChange}
              />
              
              <div className="space-y-2">
                <div className="flex justify-center">
                  {file ? (
                    <DocumentTextIcon className="w-12 h-12 text-primary-500" />
                  ) : (
                    <ArrowUpTrayIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Drag and drop your Excel file here or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports .xlsx and .xls files up to 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={!file || isUploading}
              className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                  Upload Excel File
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Template Guidelines</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-800 mb-2">Employee Expense Template</h4>
              <p className="text-sm text-gray-600">
                Required columns: Date, Employee Name, Category, Description, Amount Paid, Status
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Status should be one of: Pending, Approved, Rejected
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-800 mb-2">Salary Expense Template</h4>
              <p className="text-sm text-gray-600">
                Required columns: Date, Employee Name, Basic Salary, Allowances, Deductions, Net Salary, Payment Status
              </p>
              <p className="text-xs text-gray-500 mt-1">
                All amounts should be in numerical format
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-800 mb-2">Vendor Payment Template</h4>
              <p className="text-sm text-gray-600">
                Required columns: Invoice Date, Vendor Name, GST Number, Invoice Number, Amount, Tax Amount, Total Amount, Payment Status
              </p>
              <p className="text-xs text-gray-500 mt-1">
                GST Number must be in valid format
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-800 mb-2">Income Entry Template</h4>
              <p className="text-sm text-gray-600">
                Required columns: Date, Source, Category, Amount Received, Payment Mode, Reference Number
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Payment Mode should be one of: Cash, Bank Transfer, Check, UPI
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExcelUpload;