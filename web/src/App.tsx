import { Routes, Route } from "react-router-dom";
import { AuthProvider, STAFF, WORKSHOP } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import AppShell from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import Bookings from "@/pages/Bookings";
import Jobs from "@/pages/Jobs";
import Invoice from "@/pages/Invoice";
import MyGarage from "@/pages/MyGarage";
import Enquiries from "@/pages/Enquiries";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />

        {/* Signed in — any role */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<MyGarage />} />
            <Route path="invoice" element={<Invoice />} />

            {/* Staff areas: the backend enforces the same roles per endpoint */}
            <Route element={<ProtectedRoute roles={STAFF} />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="enquiries" element={<Enquiries />} />
            </Route>
            <Route element={<ProtectedRoute roles={WORKSHOP} />}>
              <Route path="jobs" element={<Jobs />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
