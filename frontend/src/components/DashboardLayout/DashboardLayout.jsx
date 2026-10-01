import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import "./DashboardLayout.css";

function DashboardLayout({ role }) {
  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;