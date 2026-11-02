import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserLayout } from './layouts/UserLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Portfolio } from './pages/user/Portfolio';
import { Profile } from './pages/user/Profile';
import { NewInvestment } from './pages/user/NewInvestment';
import { MyInvestments } from './pages/user/MyInvestments';
import { RoiGrowth } from './pages/user/RoiGrowth';
import { Payout } from './pages/user/Payout';
import { Community } from './pages/user/Community';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminInvestmentRequests } from './pages/admin/AdminInvestmentRequests';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminInvestments } from './pages/admin/AdminInvestments';
import { AdminRoiSettings } from './pages/admin/AdminRoiSettings';
import { AdminReferralSettings } from './pages/admin/AdminReferralSettings';
import { AdminWithdrawals } from './pages/admin/AdminWithdrawals';
import { AdminRanks } from './pages/admin/AdminRanks';
import { AdminTransactions } from './pages/admin/AdminTransactions';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { PlaceholderModule } from './pages/PlaceholderModule';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User Protected Routes */}
          <Route element={<UserLayout />}>
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/investment/new" element={<NewInvestment />} />
            <Route path="/investments" element={<MyInvestments />} />
            <Route path="/roi-growth" element={<RoiGrowth />} />
            <Route path="/payout" element={<Payout />} />
            <Route path="/community" element={<Community />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/support"
              element={
                <PlaceholderModule
                  moduleName="Institutional Support"
                  description="Official platform channels, security tickets, and direct guidance."
                  phase="Support"
                />
              }
            />
          </Route>

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="investment-requests" element={<AdminInvestmentRequests />} />
            <Route path="investments" element={<AdminInvestments />} />
            <Route path="roi-settings" element={<AdminRoiSettings />} />
            <Route path="referral-settings" element={<AdminReferralSettings />} />
            <Route
              path="spot-settings"
              element={
                <PlaceholderModule
                  moduleName="Spot Reward Settings"
                  description="Configure one-time spot reward rate on deposits."
                  phase="Phase 6"
                />
              }
            />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="ranks" element={<AdminRanks />} />
            <Route
              path="rank-rewards"
              element={
                <PlaceholderModule
                  moduleName="Rank Rewards & Claims"
                  description="Audit Trade Capital rewards and resulting investment cycles."
                  phase="Phase 8"
                />
              }
            />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route
              path="reports"
              element={
                <PlaceholderModule
                  moduleName="Platform Reports"
                  description="Financial calculations, daily payouts, and volume summaries."
                  phase="Reports"
                />
              }
            />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/portfolio" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
