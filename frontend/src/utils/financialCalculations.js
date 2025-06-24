/**
 * Calculates profit margin with consistent handling of edge cases
 * @param {number} income - Total revenue/income
 * @param {number} expenses - Total expenses
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted profit margin percentage with % symbol
 */
export const calculateProfitMargin = (income, expenses, decimals = 2) => {
  // Handle invalid inputs
  if (typeof income !== 'number' || typeof expenses !== 'number') {
    console.warn('Invalid input for profit margin calculation:', { income, expenses });
    return '0.00%';
  }

  // Ensure income is not negative
  if (income < 0) {
    console.warn('Negative income detected in profit margin calculation');
    return '0.00%';
  }

  // Avoid division by zero
  if (income === 0) {
    return '0.00%';
  }

  const profit = income - expenses;
  const margin = (profit / income) * 100;

  // Handle extreme values
  if (!isFinite(margin)) {
    return '0.00%';
  }

  return `${margin.toFixed(decimals)}%`;
};

/**
 * Formats profit/loss amount with appropriate sign and Indian Rupees
 * @param {number} amount - The profit/loss amount
 * @returns {string} Formatted amount with sign and ₹ symbol
 */
export const formatProfitLoss = (amount) => {
  if (typeof amount !== 'number') return '₹0.00';
  return `${amount >= 0 ? '+' : '-'}₹${Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Formats amount in Indian Rupees
 * @param {number} amount - The amount to format
 * @returns {string} Formatted amount with ₹ symbol
 */
export const formatIndianCurrency = (amount) => {
  if (typeof amount !== 'number') return '₹0.00';
  return `₹${Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
