import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '../components/layout/Layout';
import { AuthGuard, GuestGuard } from '../components/auth/AuthGuards';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Transactions from '../pages/Transactions';
import { Link } from 'react-router-dom';

// Lazy load components
const Dashboard = lazy(() => import('../pages/Dashboard'));
const ExpensesPage = lazy(() => import('../pages/ExpensesPage'));
const IncomePage = lazy(() => import('../pages/IncomePage'));
const ExcelUpload = lazy(() => import('../pages/ExcelUpload'));
const Reports = lazy(() => import('../pages/Reports'));
const ExpenseCategorization = lazy(() => import('../pages/ExpenseCategorization').catch(error => {
  console.error('Error loading ExpenseCategorization:', error);
  return { default: () => <div className="p-4 bg-red-50 text-red-700 rounded-lg">
    <h2 className="text-lg font-semibold">Error Loading Page</h2>
    <p>Please try refreshing the page or contact support if the problem persists.</p>
  </div> };
}));
const ExpenseForecasting = lazy(() => import('../pages/ExpenseForecasting'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const Settings = lazy(() => import('../pages/Settings'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <GuestGuard>
              <Login />
            </GuestGuard>
          }
        />
        <Route
          path="/register"
          element={
            <GuestGuard>
              <Register />
            </GuestGuard>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestGuard>
              <ForgotPassword />
            </GuestGuard>
          }
        />

        {/* Protected routes */}
        <Route
          element={
            <AuthGuard>
              <Layout>
                <Outlet />
              </Layout>
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="income-entry" element={<IncomePage />} />
          <Route path="excel-upload" element={<ExcelUpload />} />
          <Route path="reports" element={<Reports />} />
          <Route path="categorization" element={<ExpenseCategorization />} />
          <Route path="forecasting" element={<ExpenseForecasting />} />
          <Route path="settings" element={<Settings />} />
          <Route path="transactions" element={<Transactions />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes; 