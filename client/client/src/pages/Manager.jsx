import React, { useEffect, useState } from "react";
import { Users, CheckSquare, QrCode, Calendar, ArrowRight, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Manager() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/workforce/dashboard");
      setData(res.data.dashboard);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="badge badge-indigo" style={{ marginBottom: 8 }}>TEAM MANAGEMENT CONTROL</span>
          <h2>Manager Workspace</h2>
          <p>Oversee daily team attendance, assign tasks, review leave applications, and manage shifts.</p>
        </div>
        <Link to="/dashboard/workers" className="btn btn-primary">
          <UserPlus size={16} /> Add Team Worker
        </Link>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon icon-indigo"><Users size={24} /></div>
          <div className="metric-details">
            <span>Team Members</span>
            <h3>{data?.totalWorkers || 0}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon icon-emerald"><QrCode size={24} /></div>
          <div className="metric-details">
            <span>Present Today</span>
            <h3>{data?.todayAttendance || 0}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon icon-amber"><Calendar size={24} /></div>
          <div className="metric-details">
            <span>Pending Leaves</span>
            <h3>{data?.pendingLeaves || 0}</h3>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon icon-purple"><CheckSquare size={24} /></div>
          <div className="metric-details">
            <span>Active Tasks</span>
            <h3>{data?.activeTasks || 0}</h3>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="dashboard-card-grid">
        <div className="glass-card">
          <div className="metric-icon icon-indigo" style={{ marginBottom: 16 }}><Users size={22} /></div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f3f4f6' }}>Manage Team Roster</h3>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: '8px 0 18px' }}>
            View all employees, update department allocations, and update salary packages.
          </p>
          <Link to="/dashboard/workers" className="btn btn-secondary btn-sm">
            Open Workers List <ArrowRight size={14} />
          </Link>
        </div>

        <div className="glass-card">
          <div className="metric-icon icon-emerald" style={{ marginBottom: 16 }}><QrCode size={22} /></div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f3f4f6' }}>QR Scanner & Check-in</h3>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: '8px 0 18px' }}>
            Scan worker QR badges to automatically register check-ins or log manual attendance.
          </p>
          <Link to="/dashboard/attendance" className="btn btn-secondary btn-sm">
            Launch Attendance Scanner <ArrowRight size={14} />
          </Link>
        </div>

        <div className="glass-card">
          <div className="metric-icon icon-purple" style={{ marginBottom: 16 }}><CheckSquare size={22} /></div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f3f4f6' }}>Assign & Track Tasks</h3>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: '8px 0 18px' }}>
            Create tasks with priority deadlines and track Kanban completion progress.
          </p>
          <Link to="/dashboard/tasks" className="btn btn-secondary btn-sm">
            Open Task Board <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
