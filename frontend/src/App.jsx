import React from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ThemeProvider, useTheme } from "./theme.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Students from "./pages/Students.jsx";
import Employees from "./pages/Employees.jsx";
import Teachers from "./pages/Teachers.jsx";
import Expenses from "./pages/Expenses.jsx";
import Projects from "./pages/Projects.jsx";
import Loans from "./pages/Loans.jsx";
import Attendance from "./pages/Attendance.jsx";

// Full-screen spinner shown only during the initial "am I already logged
// in?" check (the /auth/me call AuthProvider fires on first load) — after
// that resolves, `checking` is false for the rest of the session.
function AuthGate() {
  const { C } = useTheme();
  return (
    <div className="min-h-screen flex items-center justify-center gap-2 text-sm" style={{ color: C.textMid }}>
      <Loader2 size={18} className="animate-spin" /> Loading…
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <AuthGate />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="employees" element={<Employees />} />
              <Route path="teachers" element={<Teachers />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="projects" element={<Projects />} />
              <Route path="loans" element={<Loans />} />
              <Route path="attendance" element={<Attendance />} />
            </Route>
          </Routes>
        </AuthProvider>
      </HashRouter>
    </ThemeProvider>
  );
}
