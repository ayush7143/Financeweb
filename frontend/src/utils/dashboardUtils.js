// Utility function to trigger dashboard refresh
export const triggerDashboardRefresh = () => {
  // Dispatch custom event to refresh dashboard data
  window.dispatchEvent(new CustomEvent('dashboardRefresh'));
  console.log('Dashboard refresh event triggered');
};

// Utility function to clear all cached data
export const clearDashboardCache = () => {
  // Clear any localStorage cache
  const keysToRemove = Object.keys(localStorage).filter(key => 
    key.includes('dashboard') || 
    key.includes('chart') || 
    key.includes('financial')
  );
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Trigger refresh
  triggerDashboardRefresh();
  console.log('Dashboard cache cleared and refresh triggered');
};

// Function to force refresh all financial data
export const refreshFinancialData = async () => {
  try {
    // Clear cache first
    clearDashboardCache();
    
    // Add a small delay to ensure cache is cleared
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Trigger refresh events
    window.dispatchEvent(new CustomEvent('dashboardRefresh'));
    window.dispatchEvent(new CustomEvent('financialDataRefresh'));
    
    console.log('Financial data refresh initiated');
    return true;
  } catch (error) {
    console.error('Error refreshing financial data:', error);
    return false;
  }
};
