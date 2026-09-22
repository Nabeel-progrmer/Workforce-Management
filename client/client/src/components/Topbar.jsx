import {
  Bell,
  Menu,
  Search
} from "lucide-react";

export default function Topbar({
  setSidebarOpen,
  user
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="menu-button"
          onClick={() =>
            setSidebarOpen(true)
          }
        >
          <Menu size={22} />
        </button>

        <div className="search-box">
          <Search size={18} />

          <input
            placeholder="Search anything..."
          />

          <kbd>⌘ K</kbd>
        </div>
      </div>

      <div className="topbar-right">
        <button className="notification-button">
          <Bell size={19} />

          <span />
        </button>

        <div className="top-user">
          <div className="avatar">
            {user?.name
              ?.charAt(0)
              ?.toUpperCase() || "U"}
          </div>

          <div className="top-user-info">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}