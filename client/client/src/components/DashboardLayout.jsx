import React from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  QrCode,
  CheckSquare,
  CalendarDays,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useTheme } from "../App";
import WorkforceLogo from "./WorkforceLogo";

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNavigation = () => setSidebarOpen(false);

  React.useEffect(() => {
    if (!sidebarOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const role = (user?.role || "worker").toLowerCase();

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      roles: ["ceo", "manager", "worker"]
    },
    {
      label: "Team Workers Roster",
      icon: Users,
      path: "/dashboard/workers",
      roles: ["ceo", "manager"]
    },
    {
      label: "Departments",
      icon: Building2,
      path: "/dashboard/departments",
      roles: ["ceo", "manager"]
    },
    {
      label: "Work Shifts",
      icon: Clock,
      path: "/dashboard/shifts",
      roles: ["ceo", "manager"]
    },
    {
      label: "Attendance & QR",
      icon: QrCode,
      path: "/dashboard/attendance",
      roles: ["ceo", "manager", "worker"]
    },
    {
      label: "Tasks & Kanban",
      icon: CheckSquare,
      path: "/dashboard/tasks",
      roles: ["ceo", "manager", "worker"]
    },
    {
      label: "Leave Applications",
      icon: CalendarDays,
      path: "/dashboard/leaves",
      roles: ["ceo", "manager", "worker"]
    },
    {
      label: "Payroll & Payslips",
      icon: CreditCard,
      path: "/dashboard/payroll",
      roles: ["ceo", "manager", "worker"]
    },
    {
      label: "Profile & QR Badge",
      icon: User,
      path: "/dashboard/profile",
      roles: ["ceo", "manager", "worker"]
    }
  ];

  const visibleNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside id="primary-navigation" className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <button
          type="button"
          className="mobile-menu-close"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={22} />
        </button>
        <div className="sidebar-header">
          <WorkforceLogo size={42} />
          <div className="brand-text">
            <h2>Workforce</h2>
            <span>MONOCHROME ERP</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <span className="sidebar-label">{role.toUpperCase()} MENU</span>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? "active" : ""}`}
                onClick={handleNavigation}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="avatar">
              {user?.profileImage
                ? <img src={user.profileImage} alt="" />
                : user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="user-badge-info">
              <h4>{user?.name || "User"}</h4>
              <span>{role} workspace</span>
            </div>
          </div>

          <button onClick={handleLogout} className="btn btn-outline btn-sm" style={{ width: '100%' }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="navbar">
          <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="menu-button"
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="primary-navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <WorkforceLogo size={32} />
            <h1>Workforce Enterprise ERP</h1>
          </div>
          <div className="nav-right">
            {/* Professional Sliding Switch Theme Toggle */}
            <button
              type="button"
              className="theme-switch-container"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-pressed={theme === "dark"}
            >
              <div className="theme-switch-track">
                <Sun size={14} style={{ color: '#fbbf24' }} />
                <Moon size={14} style={{ color: '#94a3b8' }} />
                <div className="theme-switch-thumb">
                  {theme === "light" ? <Sun size={13} /> : <Moon size={13} />}
                </div>
              </div>
            </button>

            <span className="badge">
              <Sparkles size={13} />
              {role.toUpperCase()} PORTAL
            </span>

            <div className="user-badge" style={{ padding: '6px 14px' }}>
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 13 }}>
                {user?.profileImage
                  ? <img src={user.profileImage} alt="" />
                  : user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="page-container">{children}</main>
      </div>
    </div>
  );
}
