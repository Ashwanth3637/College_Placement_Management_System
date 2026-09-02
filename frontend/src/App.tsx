import { useState, Component, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#ffffff", fontFamily: "system-ui, sans-serif", padding: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", border: "1.5px solid #94a3b8", boxShadow: "0 10px 25px rgba(0,0,0,0.07)", maxWidth: "440px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎓</div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0" }}>Campus Placement Portal</h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px 0" }}>
              Click below to load the sign-in portal cleanly.
            </p>
            <button
              onClick={() => {
                try {
                  localStorage.clear();
                } catch (e) {}
                window.location.href = "/login";
              }}
              style={{ width: "100%", padding: "12px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}
            >
              Open Login Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const [user, setUser] = useState<any>(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      if (!savedToken || !savedUser || savedUser === "undefined" || savedUser === "null") return null;
      const parsed = JSON.parse(savedUser);
      if (parsed && typeof parsed === "object" && parsed.email && parsed.role) {
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const navigate = useNavigate();

  const userRole = (user?.role || '').toLowerCase().trim();
  const isStudent = userRole === 'student';
  const isRecruiter = userRole === 'recruiter';
  const isCoordinator = userRole === 'coordinator';
  const isOfficer = ['officer', 'admin', 'tpo'].includes(userRole);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    try {
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (e) {}
    const role = (userData?.role || '').toLowerCase().trim();
    if (role === 'recruiter') {
      navigate('/recruiter/dashboard');
    } else if (role === 'coordinator') {
      navigate('/coordinator/dashboard');
    } else if (['officer', 'admin', 'tpo'].includes(role)) {
      navigate('/officer/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (e) {}
    setUser(null);
    navigate('/login');
  };

  const getDashboardRedirect = () => {
    if (isRecruiter) return <Navigate to="/recruiter/dashboard" replace />;
    if (isCoordinator) return <Navigate to="/coordinator/dashboard" replace />;
    if (isOfficer) return <Navigate to="/officer/dashboard" replace />;
    if (isStudent) return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/login" replace />;
  };

  const renderLogin = <Login onLoginSuccess={handleLoginSuccess} />;

  return (
    <Routes>
      {/* Root Route: Always show Login page first when visiting localhost link */}
      <Route
        path="/"
        element={renderLogin}
      />

      {/* Login Page */}
      <Route
        path="/login"
        element={renderLogin}
      />

      {/* Generic Dashboard (Protected) */}
      <Route
        path="/dashboard"
        element={user ? getDashboardRedirect() : renderLogin}
      />

      {/* Student Portal Protected Routes */}
      <Route
        path="/student/dashboard"
        element={
          user ? (
            <StudentDashboard initialTab="dashboard" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/student/campus-drives"
        element={
          user ? (
            <StudentDashboard initialTab="companies" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/student/applications"
        element={
          user ? (
            <StudentDashboard initialTab="applications" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/student/interviews"
        element={
          user ? (
            <StudentDashboard initialTab="schedule" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/student/results"
        element={
          user ? (
            <StudentDashboard initialTab="results" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/student/profile"
        element={
          user ? (
            <StudentDashboard initialTab="profile" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/student"
        element={
          user ? (
            <StudentDashboard initialTab="dashboard" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />

      {/* Coordinator Protected Routes */}
      <Route
        path="/coordinator/dashboard"
        element={
          user ? (
            <CoordinatorDashboard initialTab="dashboard" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/coordinator/:tab"
        element={
          user ? (
            <CoordinatorDashboard user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />

      {/* Placement Officer Protected Routes */}
      <Route
        path="/officer/dashboard"
        element={
          user ? (
            <OfficerDashboard initialTab="stats" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/officer/applications"
        element={
          user ? (
            <OfficerDashboard initialTab="applications" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/officer/companies"
        element={
          user ? (
            <OfficerDashboard initialTab="companies" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/officer/drives"
        element={
          user ? (
            <OfficerDashboard initialTab="drives" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/officer/students"
        element={
          user ? (
            <OfficerDashboard initialTab="verification" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/officer/verification"
        element={
          user ? (
            <OfficerDashboard initialTab="verification" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/officer/eligibility"
        element={
          user ? (
            <OfficerDashboard initialTab="eligibility" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/officer/interviews"
        element={
          user ? (
            <OfficerDashboard initialTab="interviews" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/officer/selections"
        element={
          user ? (
            <OfficerDashboard initialTab="selections" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/officer/reports"
        element={
          user ? (
            <OfficerDashboard initialTab="reports" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/officer/seasons"
        element={
          user ? (
            <OfficerDashboard initialTab="seasons" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/officer/audit-logs"
        element={
          user ? (
            <OfficerDashboard initialTab="audit_logs" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/officer"
        element={
          user ? (
            <OfficerDashboard initialTab="stats" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />

      {/* Recruiter Portal Protected Routes */}
      <Route
        path="/recruiter/dashboard"
        element={
          user ? (
            <RecruiterDashboard initialTab="stats" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/recruiter/company-profile"
        element={
          user ? (
            <RecruiterDashboard initialTab="company_profile" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/recruiter/placement-drives"
        element={
          user ? (
            <RecruiterDashboard initialTab="drives" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/recruiter/candidates"
        element={
          user ? (
            <RecruiterDashboard initialTab="candidates" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/recruiter/applications"
        element={
          user ? (
            <RecruiterDashboard initialTab="applications" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/recruiter/interviews"
        element={
          user ? (
            <RecruiterDashboard initialTab="interviews" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/recruiter/selections"
        element={
          user ? (
            <RecruiterDashboard initialTab="selections" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />
      <Route
        path="/recruiter"
        element={
          user ? (
            <RecruiterDashboard initialTab="stats" user={user} onLogout={handleLogout} />
          ) : (
            renderLogin
          )
        }
      />

      {/* Catch-all fallback route: Always shows Login or user's dashboard */}
      <Route
        path="*"
        element={user ? getDashboardRedirect() : renderLogin}
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
