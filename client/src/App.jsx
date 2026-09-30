import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import SeekerProfile from './pages/SeekerProfile';
import JobList from './pages/JobList';
import MyApplications from './pages/MyApplications';
import HRDashboard from './pages/HRDashboard';
import RankedCandidates from './pages/RankedCandidates';

function Guard({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  const home = !user ? '/login' : user.role === 'hr' ? '/hr' : '/jobs';

  return (
    <>
      <header className="nav">
        <div className="brand-group">
          <NavLink to="/" className="brand-logo">
            <span className="brand-icon">⚡</span>
            <span className="brand-title">SmartMatch</span>
            <span className="brand-sub">Job Portal</span>
          </NavLink>
          {user && (
            <span className={`role-badge ${user.role === 'hr' ? 'role-hr' : 'role-seeker'}`}>
              {user.role === 'hr' ? '🏢 HR & Recruiter' : '👤 Candidate'}
            </span>
          )}
        </div>

        <nav>
          {user?.role === 'seeker' && (
            <>
              <NavLink to="/jobs">Explore Jobs</NavLink>
              <NavLink to="/applications">My Applications</NavLink>
              <NavLink to="/profile">My Profile & Skills</NavLink>
            </>
          )}

          {user?.role === 'hr' && (
            <>
              <NavLink to="/hr">Dashboard & Vacancies</NavLink>
            </>
          )}

          {!user && (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register" className="nav-btn-highlight">Create Account</NavLink>
            </>
          )}

          {user && (
            <div className="user-menu">
              <span className="user-name">{user.name}</span>
              <button className="btn-logout" onClick={logout} title="Sign Out">Log out</button>
            </div>
          )}
        </nav>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<Navigate to={home} replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Candidate Routes */}
          <Route path="/jobs" element={<Guard role="seeker"><JobList /></Guard>} />
          <Route path="/applications" element={<Guard role="seeker"><MyApplications /></Guard>} />
          <Route path="/profile" element={<Guard role="seeker"><SeekerProfile /></Guard>} />

          {/* HR & Recruiter Routes */}
          <Route path="/hr" element={<Guard role="hr"><HRDashboard /></Guard>} />
          <Route path="/hr/jobs/:jobId" element={<Guard role="hr"><RankedCandidates /></Guard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
