import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Quotations from './pages/Quotations';
import QuotationDetail from './pages/QuotationDetail';
import SalesOrders from './pages/SalesOrders';
import Projects from './pages/Projects';
import NewProject from './pages/NewProject';
import TicketDetail from './pages/TicketDetail';
import ServiceBoard from './pages/ServiceBoard';
import SystemConfig from './pages/SystemConfig';
import ServiceTeam from './pages/ServiceTeam';
import SalesTeam from './pages/SalesTeam';
import ClaimsPortal from './pages/ClaimsPortal';
import IpadOnsiteTest from './pages/IpadOnsiteTest';
import StaffPortal from './pages/StaffPortal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="quotations/create" element={<QuotationDetail mode="create" />} />
          <Route path="quotations/:id" element={<QuotationDetail mode="view" />} />
          <Route path="sales-orders" element={<SalesOrders />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/new" element={<NewProject />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="service-board" element={<ServiceBoard />} />
          <Route path="service-team" element={<ServiceTeam />} />
          <Route path="sales-team" element={<SalesTeam />} />
          <Route path="claims" element={<ClaimsPortal />} />
          <Route path="ipad-onsite-test" element={<IpadOnsiteTest />} />
          <Route path="staff-portal" element={<StaffPortal />} />
          <Route path="system-config" element={<SystemConfig />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
