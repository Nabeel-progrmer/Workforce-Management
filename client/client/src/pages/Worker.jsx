import React, { useEffect, useState } from "react";
import { LogIn, LogOut, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../App";
import api from "../api";

export default function Worker() {
  const { user } = useAuth();

  const [todayAttendance, setTodayAttendance] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState("");

  const qrTokenValue = user?.qrToken || `worker-${user?.id || user?._id || "token-demo"}`;

  useEffect(() => {
    fetchWorkerData();
  }, []);

  const fetchWorkerData = async () => {
    try {
      setLoading(true);
      const [attRes, taskRes] = await Promise.all([
        api.get("/workforce/attendance/my"),
        api.get("/workforce/tasks/my")
      ]);

      const now = new Date();
      const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
      const todayStr = localDate.toISOString().slice(0, 10);
      const todayRec = attRes.data.attendance?.find((r) => r.date === todayStr);
      setTodayAttendance(todayRec || null);

      setTasks(taskRes.data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setChecking(true);
      setMsg("");
      const res = await api.post("/workforce/attendance/check-in", {
        qrToken: qrTokenValue
      });
      setMsg("✅ Check-in recorded successfully!");
      fetchWorkerData();
    } catch (err) {
      setMsg(`❌ ${err.response?.data?.message || "Check-in failed"}`);
    } finally {
      setChecking(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setChecking(true);
      setMsg("");
      const res = await api.post("/workforce/attendance/check-out");
      setMsg("✅ Check-out recorded successfully!");
      fetchWorkerData();
    } catch (err) {
      setMsg(`❌ ${err.response?.data?.message || "Check-out failed"}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="badge badge-emerald" style={{ marginBottom: 8 }}>WORKER HUB PORTAL</span>
          <h2>Welcome Back, {user?.name}!</h2>
          <p>Display your scannable mobile QR badge, log attendance, and manage daily tasks.</p>
        </div>
      </div>

      <div className="dashboard-card-grid worker-card-grid">
        {/* Attendance Timer Card */}
        <div className="bento-card" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(21, 32, 53, 0.8) 100%)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.1em' }}>
            TODAY'S WORKDAY STATUS
          </span>
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', marginTop: 6 }}>
            {todayAttendance ? (
              todayAttendance.checkOut ? (
                <span style={{ color: '#34d399' }}>Workday Completed</span>
              ) : (
                <span style={{ color: '#38bdf8' }}>Currently Checked In</span>
              )
            ) : (
              <span style={{ color: '#fbbf24' }}>Not Checked In Today</span>
            )}
          </h3>

          {todayAttendance && (
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Check-in: {new Date(todayAttendance.checkIn).toLocaleTimeString()}
              {todayAttendance.checkOut && ` | Check-out: ${new Date(todayAttendance.checkOut).toLocaleTimeString()}`}
            </p>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            {!todayAttendance && (
              <button onClick={handleCheckIn} disabled={checking} className="btn btn-emerald" style={{ width: '100%' }}>
                <LogIn size={18} /> Instant 1-Click Check-In
              </button>
            )}

            {todayAttendance && !todayAttendance.checkOut && (
              <button onClick={handleCheckOut} disabled={checking} className="btn btn-rose" style={{ width: '100%' }}>
                <LogOut size={18} /> Record Check-Out
              </button>
            )}
          </div>

          {msg && (
            <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700, color: msg.includes('❌') ? '#f87171' : '#34d399' }}>
              {msg}
            </div>
          )}
        </div>

        {/* Real Scannable Worker Mobile QR Badge Card */}
        <div className="bento-card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(21, 32, 53, 0.95) 0%, rgba(12, 19, 34, 0.95) 100%)', borderColor: 'rgba(168, 85, 247, 0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#c084fc', letterSpacing: '0.12em' }}>
            <Smartphone size={14} /> SCANNABLE MOBILE QR BADGE
          </div>

          <div style={{ margin: '18px auto', padding: 14, background: '#fff', borderRadius: 16, width: 170, height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)' }}>
            <QRCodeSVG value={qrTokenValue} size={142} />
          </div>

          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            Show this QR to Manager Camera Scanner
          </span>
        </div>
      </div>

      {/* Task List Preview */}
      <div className="bento-card">
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: '#f8fafc' }}>Assigned Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>You currently have no pending tasks assigned.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tasks.map((task) => (
              <div key={task._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(12, 19, 34, 0.7)', borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>{task.title}</h4>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{task.description || "No description provided."}</p>
                </div>
                <span className={`badge ${task.status === 'Completed' ? 'badge-emerald' : task.status === 'In Progress' ? 'badge-sky' : 'badge-amber'}`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
