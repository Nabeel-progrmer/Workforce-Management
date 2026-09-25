import React, { useEffect, useState } from "react";
import { Users, Building2, CheckSquare, Activity, TrendingUp } from "lucide-react";
import api from "../api";
import { SkeletonMetric, SkeletonCard, SkeletonTable } from "../components/SkeletonLoader";

export default function CEO() {
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
          <span className="badge" style={{ marginBottom: 8 }}>EXECUTIVE COMMAND CENTER</span>
          <h2>Executive Dashboard Overview</h2>
          <p>Real-time workforce intelligence, operational performance, and enterprise health.</p>
        </div>
        <button onClick={fetchDashboard} className="btn btn-outline">
          Refresh Metrics <TrendingUp size={16} />
        </button>
      </div>

      {loading ? (
        <div>
          <div className="metrics-grid">
            <SkeletonMetric />
            <SkeletonMetric />
            <SkeletonMetric />
            <SkeletonMetric />
          </div>
          <div className="dashboard-card-grid dashboard-card-grid-two">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      ) : (
        <div>
          {/* Metrics Row */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon"><Users size={24} /></div>
              <div className="metric-details">
                <span>Total Workforce</span>
                <h3>{data?.totalWorkers || 0}</h3>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon"><Activity size={24} /></div>
              <div className="metric-details">
                <span>Attendance Rate</span>
                <h3>{data?.attendanceRate || 0}%</h3>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon"><Building2 size={24} /></div>
              <div className="metric-details">
                <span>Active Departments</span>
                <h3>{data?.totalDepartments || 0}</h3>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon"><CheckSquare size={24} /></div>
              <div className="metric-details">
                <span>Active Tasks</span>
                <h3>{data?.activeTasks || 0}</h3>
              </div>
            </div>
          </div>

          <div className="dashboard-card-grid">
            {/* Recent Attendance Log */}
            <div className="bento-card">
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>Today's Check-in Log</h3>
              {data?.recentAttendance?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No check-in activity recorded yet for today.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data?.recentAttendance?.map((item) => (
                    <div key={item._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-main)' }}>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.worker?.name || "Worker"}</h4>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.worker?.jobTitle || "Employee"}</span>
                      </div>
                      <span className="badge">
                        {new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System Operations Card */}
            <div className="bento-card">
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>System Operational Health</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>Database Connection</strong>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Enterprise Mongoose cluster connected & active.</p>
                </div>
                <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>QR Code Engine</strong>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>SHA-256 encrypted verification active for attendance check-ins.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
