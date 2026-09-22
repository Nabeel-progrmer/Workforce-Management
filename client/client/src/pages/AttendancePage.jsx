import React, { useEffect, useState } from "react";
import { QrCode, Camera, ShieldCheck, Search, Clock } from "lucide-react";
import { useAuth } from "../App";
import api from "../api";
import CameraQRScannerModal from "../components/CameraQRScannerModal";

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualToken, setManualToken] = useState("");
  const [scanMsg, setScanMsg] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const isExecutive = ["ceo", "manager"].includes(user?.role?.toLowerCase());

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const endpoint = isExecutive ? "/workforce/attendance" : "/workforce/attendance/my";
      const res = await api.get(endpoint);
      setAttendance(res.data.attendance || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processScanToken = async (tokenString) => {
    try {
      setScanMsg("");
      const res = await api.post("/workforce/attendance/check-in", { qrToken: tokenString });
      setScanMsg(`✅ Attendance Check-in Successful: ${res.data.message || "Recorded"}`);
      fetchAttendance();
    } catch (err) {
      setScanMsg(`❌ ${err.response?.data?.message || "Invalid or unrecognized QR token"}`);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken) {
      processScanToken(manualToken);
      setManualToken("");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="badge badge-sky" style={{ marginBottom: 8 }}>REAL-TIME ATTENDANCE TERMINAL</span>
          <h2>Attendance Log & Camera QR Scanner</h2>
          <p>Scan employee mobile QR badges live via camera or review attendance logs.</p>
        </div>

        {isExecutive && (
          <button onClick={() => setIsCameraOpen(true)} className="btn btn-sky">
            <Camera size={18} /> Launch Camera Scanner
          </button>
        )}
      </div>

      {/* Live Camera Scanner Launcher Card */}
      <div className="bento-card" style={{ marginBottom: 28, background: 'linear-gradient(135deg, rgba(12, 19, 34, 0.9) 0%, rgba(21, 32, 53, 0.8) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="metric-icon icon-sky"><Camera size={26} /></div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc' }}>Live Camera QR Badge Verification</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                Turn on camera webcam to scan worker mobile screen QR codes directly.
              </p>
            </div>
          </div>

          {isExecutive && (
            <button onClick={() => setIsCameraOpen(true)} className="btn btn-emerald" style={{ padding: '12px 24px' }}>
              <Camera size={20} /> Open Camera Scanner
            </button>
          )}
        </div>

        {/* Manual Fallback Input */}
        <form onSubmit={handleManualSubmit} style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <input
            type="text"
            className="input-field"
            style={{ flex: 1, minWidth: 260 }}
            placeholder="Or type/paste worker QR token (e.g. worker-99f8e812)..."
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
          />
          <button type="submit" className="btn btn-glass">
            <ShieldCheck size={18} /> Process Token
          </button>
        </form>

        {scanMsg && (
          <div style={{ marginTop: 14, fontSize: 14, fontWeight: 700, color: scanMsg.includes('❌') ? '#f87171' : '#34d399' }}>
            {scanMsg}
          </div>
        )}
      </div>

      {/* Attendance Log Table */}
      <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              {isExecutive && <th>Employee</th>}
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                  No attendance records logged.
                </td>
              </tr>
            ) : (
              attendance.map((rec) => (
                <tr key={rec._id} className="table-row">
                  <td style={{ fontWeight: 700, color: '#f8fafc' }}>{rec.date}</td>
                  {isExecutive && (
                    <td>
                      <strong style={{ color: '#f8fafc' }}>{rec.worker?.name || "Worker"}</strong>
                      <span style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>{rec.worker?.jobTitle || ""}</span>
                    </td>
                  )}
                  <td>{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</td>
                  <td>{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</td>
                  <td>
                    <span className="badge badge-sky">{rec.checkInMethod || "QR"}</span>
                  </td>
                  <td>
                    <span className={`badge ${rec.status === 'Completed' ? 'badge-emerald' : 'badge-amber'}`}>
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Camera QR Scanner Modal */}
      <CameraQRScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={(token) => {
          setIsCameraOpen(false);
          processScanToken(token);
        }}
      />
    </div>
  );
}
