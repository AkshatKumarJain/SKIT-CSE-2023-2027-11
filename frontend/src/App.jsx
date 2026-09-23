import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getUserRole } from "./services/auth";

import Navbar from "./components/Navbar/Navbar";
import DashboardLayout from "./components/DashboardLayout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import Login from "./pages/Login/Login";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import Profile from "./pages/Profile/Profile";

import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";

function App() {
  const role = getUserRole();

  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/profile" element={<Profile />} />

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute role={role} allowedRole="student">
              <DashboardLayout role="student" />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
        </Route>

        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute role={role} allowedRole="teacher">
              <DashboardLayout role="teacher" />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
        </Route>

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role={role} allowedRole="admin">
              <DashboardLayout role="admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;