import { Routes, Route } from "react-router-dom";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import AppShell from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import Bookings from "@/pages/Bookings";
import Jobs from "@/pages/Jobs";
import Invoice from "@/pages/Invoice";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="invoice" element={<Invoice />} />
      </Route>
    </Routes>
  );
}
