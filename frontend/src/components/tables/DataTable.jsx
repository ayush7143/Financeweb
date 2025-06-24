import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const DataTable = ({ 
  columns, 
  data,
  isLoading = false,
  pagination = true,
  initialSort = { field: '', direction: '' },
  onSort = null,
  onFilter = null,
  itemsPerPageOptions = [10, 25, 50, 100],
  initialItemsPerPage = 10
}) => {
  const [sortField, setSortField] = useState(initialSort.field);
  const [sortDirection, setSortDirection] = useState(initialSort.direction);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(data);
  
  // Update filtered data when data changes
  useEffect(() => {
    setFilteredData(data);
  }, [data]);
  
  // Handle client-side filtering if no onFilter provided
  useEffect(() => {
    if (!onFilter && searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = data.filter(item => {
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(lowercasedQuery)
        );
      });
      setFilteredData(filtered);
      setCurrentPage(1);
    } else if (!onFilter) {
      setFilteredData(data);
    }
  }, [searchQuery, data, onFilter]);
  
  // Handle search query change
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (onFilter) {
      onFilter(query);
    }
  };
  
  // Handle sort
  const handleSort = (field) => {
    const newDirection = 
      field === sortField
        ? sortDirection === 'asc'
          ? 'desc'
          : sortDirection === 'desc'
            ? ''
            : 'asc'
        : 'asc';
    
    setSortField(field);
    setSortDirection(newDirection);
    
    if (onSort) {
      onSort(field, newDirection);
    } else {
      // Client-side sorting
      const sorted = [...filteredData].sort((a, b) => {
        if (newDirection === '') return 0;
        
        const aValue = a[field];
        const bValue = b[field];
        
        if (newDirection === 'asc') {
          if (typeof aValue === 'string') {
            return aValue.localeCompare(bValue);
          }
          return aValue - bValue;
        } else {
          if (typeof aValue === 'string') {
            return bValue.localeCompare(aValue);
          }
          return bValue - aValue;
        }
      });
      
      setFilteredData(sorted);
    }
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };
  
  // Render sort icon
  const renderSortIcon = (field) => {
    if (field !== sortField) {
      return <ChevronUpDownIcon className="w-4 h-4" />;
    }
    
    if (sortDirection === 'asc') {
      return <ChevronUpIcon className="w-4 h-4" />;
    }
    
    if (sortDirection === 'desc') {
      return <ChevronDownIcon className="w-4 h-4" />;
    }
    
    return <ChevronUpDownIcon className="w-4 h-4" />;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Table Search */}
      <div className="p-4 border-b">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.field}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable !== false ? 'cursor-pointer select-none' : ''
                  }`}
                  onClick={() => column.sortable !== false && handleSort(column.field)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable !== false && (
                      <span className="text-gray-400">
                        {renderSortIcon(column.field)}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                  <div className="flex justify-center items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              currentData.map((row, rowIndex) => (
                <motion.tr 
                  key={row.id || rowIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: rowIndex * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  {columns.map((column) => (
                    <td 
                      key={column.field} 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {column.render 
                        ? column.render(row[column.field], row)
                        : row[column.field]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex items-center">
            <label htmlFor="itemsPerPage" className="text-sm text-gray-700 mr-2">
              Show
            </label>
            <select
              id="itemsPerPage"
              className="border border-gray-300 rounded-md p-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700 ml-2">
              entries
            </span>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{endIndex}</span> of{' '}
                  <span className="font-medium">{filteredData.length}</span> results
                </p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-2 pl-4" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
              </button>
              
              {/* Page buttons for smaller page counts */}
              {totalPages <= 5 ? (
                [...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === i + 1
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))
              ) : (
                // Page buttons for larger page counts
                <>
                  {/* First page */}
                  <button
                    onClick={() => handlePageChange(1)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === 1
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    1
                  </button>
                  
                  {/* Ellipsis or page 2 */}
                  {currentPage > 3 && (
                    <span className="px-2 py-1 text-gray-500">...</span>
                  )}
                  
                  {/* Current page -1 if not first or second page */}
                  {currentPage > 2 && (
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-3 py-1 rounded-md text-gray-500 hover:bg-gray-50"
                    >
                      {currentPage - 1}
                    </button>
                  )}
                  
                  {/* Current page if not first or last page */}
                  {currentPage !== 1 && currentPage !== totalPages && (
                    <button
                      onClick={() => handlePageChange(currentPage)}
                      className="px-3 py-1 rounded-md bg-primary-500 text-white"
                    >
                      {currentPage}
                    </button>
                  )}
                  
                  {/* Current page +1 if not last or second last page */}
                  {currentPage < totalPages - 1 && (
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-3 py-1 rounded-md text-gray-500 hover:bg-gray-50"
                    >
                      {currentPage + 1}
                    </button>
                  )}
                  
                  {/* Ellipsis or second last page */}
                  {currentPage < totalPages - 2 && (
                    <span className="px-2 py-1 text-gray-500">...</span>
                  )}
                  
                  {/* Last page */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === totalPages
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-500" />
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable; 