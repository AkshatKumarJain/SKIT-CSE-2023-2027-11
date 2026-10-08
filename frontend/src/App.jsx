import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { getUserRole } from "./services/auth";
import { getMyProfile } from "./services/profileService";

import Navbar from "./components/Navbar/Navbar";
import DashboardLayout from "./components/DashboardLayout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import Login from "./pages/Login/Login";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Profile from "./pages/Profile/Profile";

import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard/TeacherDashboard";
import TeacherProjectProposal from "./pages/TeacherProjectProposal/TeacherProjectProposal";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";

import ProjectSelection from "./pages/Projectselection/Projectselection";
import StudentIdea from "./pages/Studentidea/Studentidea";
import FacultyIdea from "./pages/Facultyidea/Facultyidea";
import ProjectBank from "./pages/Projectbank/Projectbank";
import TeamSelection from "./pages/TeamSelection/TeamSelection";

import "./pages/Projectselection/Projectselection.css";

function AppContent() {
  const location = useLocation();

  const [role, setRole] = useState(getUserRole());
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const currentRole = getUserRole();

    setRole(currentRole);

    if (!currentRole) {
      setProfile(null);
      return;
    }

    const loadProfile = async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);
      } catch (error) {
        console.error("Failed to load profile:", error);
        setProfile(null);
      }
    };

    loadProfile();
  }, [location]);

  const handleProfileUpdate = useCallback((updatedProfile) => {
    setProfile(updatedProfile);
  }, []);

  const isLoggedIn = !!role;

  return (
    <>
      <Navbar
        isLoggedIn={isLoggedIn}
        name={profile?.name || ""}
        profileImage={profile?.profilePhotoUrl || ""}
      />

      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<Login />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        <Route
          path="/profile"
          element={
            <Profile
              onProfileUpdate={handleProfileUpdate}
            />
          }
        />

        {/* Student Project Selection */}
        <Route
          path="/project-selection"
          element={
            <ProtectedRoute allowedRole="student">
              <DashboardLayout role="student" />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<ProjectSelection />}
          />

          <Route
            path="student-idea"
            element={<StudentIdea />}
          />

          <Route
            path="faculty"
            element={<FacultyIdea />}
          />

          <Route
            path="bank"
            element={<ProjectBank />}
          />

          <Route
            path="team"
            element={<TeamSelection />}
          />
        </Route>

        {/* Student Dashboard */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <DashboardLayout role="student" />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<StudentDashboard />}
          />
        </Route>

        {/* Teacher Dashboard */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRole="teacher">
              <DashboardLayout role="teacher" />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<TeacherDashboard />}
          />

          <Route
            path="project-proposals"
            element={<TeacherProjectProposal />}
          />
        </Route>

        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <DashboardLayout role="admin" />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<AdminDashboard />}
          />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;