import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, Clock, QrCode, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "../App";
import api from "../api";
import CameraQRScannerModal from "../components/CameraQRScannerModal";
import "./AttendancePage.css"; // keep custom css for colours, globals

/* ---------------------------------------------------------------
   Helper utilities
   --------------------------------------------------------------- */
const getErrorMessage = (error, fallback = "Something went wrong.") =>
  error?.response?.data?.message || error?.message || fallback;

const getTodayKey = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [scanMsg, setScanMsg] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const role = user?.role?.toLowerCase() || "";
  const isExecutive = useMemo(() => ["ceo", "manager"].includes(role), [role]);
  const isWorker = role === "worker";

  /* ---------------------------------------------------------------
     Fetch attendance data
     --------------------------------------------------------------- */
  const fetchAttendance = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const endpoint = isExecutive ? "/workforce/attendance" : "/workforce/attendance/my";
      const res = await api.get(endpoint);
      if (res.data?.success) setAttendance(res.data.attendance || []);
      else setAttendance([]);
    } catch (error) {
      console.error("Attendance fetch error:", error);
      setScanMsg(getErrorMessage(error, "Unable to load attendance records."));
    } finally {
      setLoading(false);
    }
  }, [user, isExecutive]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  /* ---------------------------------------------------------------
     Today record helper (worker only)
     --------------------------------------------------------------- */
  const todayRecord = useMemo(() => {
    if (!isWorker) return null;
    const today = getTodayKey();
    return attendance.find((r) => r.date === today) || null;
  }, [attendance, isWorker]);

  /* ---------------------------------------------------------------
     Worker check‑in / check‑out handlers
     --------------------------------------------------------------- */
  const handleSelfCheckIn = async () => {
    if (!isWorker || actionLoading) return;
    try {
      setActionLoading(true);
      setScanMsg("");
      const res = await api.post("/workforce/attendance/check-in");
      setScanMsg(`✅ ${res.data?.message || "Check‑in recorded successfully."}`);
      await fetchAttendance();
    } catch (error) {
      console.error("Self check‑in error:", error);
      setScanMsg(`❌ ${getErrorMessage(error, "Unable to record check‑in.")}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelfCheckOut = async () => {
    if (!isWorker || actionLoading) return;
    try {
      setActionLoading(true);
      setScanMsg("");
      const res = await api.post("/workforce/attendance/check-out");
      setScanMsg(`✅ ${res.data?.message || "Check‑out recorded successfully."}`);
      await fetchAttendance();
    } catch (error) {
      console.error("Self check‑out error:", error);
      setScanMsg(`❌ ${getErrorMessage(error, "Unable to record check‑out.")}`);
    } finally {
      setActionLoading(false);
    }
  };

  /* ---------------------------------------------------------------
     Executive QR handling
     --------------------------------------------------------------- */
  const processScanToken = async (tokenString) => {
    const token = String(tokenString || "").trim();
    if (!token || scanLoading) return;
    if (!isExecutive) {
      setScanMsg("❌ Only CEO or Manager accounts can scan worker QR badges.");
      return;
    }
    try {
      setScanLoading(true);
      setScanMsg("");
      const res = await api.post("/workforce/attendance/check-in", { qrToken: token });
      setScanMsg(`✅ ${res.data?.message || "Attendance check‑in completed successfully."}`);
      setManualToken("");
      await fetchAttendance();
    } catch (error) {
      console.error("QR attendance error:", error);
      setScanMsg(`❌ ${getErrorMessage(error, "Invalid or unrecognized QR token.")}`);
    } finally {
      setScanLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const token = manualToken.trim();
    if (!token || scanLoading) return;
    await processScanToken(token);
  };

  const handleScanSuccess = async (token) => {
    setIsCameraOpen(false);
    if (!token) {
      setScanMsg("❌ No QR token was detected.");
      return;
    }
    await processScanToken(token);
  };

  const handleCloseCamera = () => setIsCameraOpen(false);

  const getStatusClass = (status) =>
    status === "Completed" ? "badge badge-emerald" : "badge badge-amber";

  const formatTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="attendance-page">
      {/* Header */}
      <div className="attendance-header page-header flex flex-wrap gap-4 items-start justify-between mb-6">
        <div>
          <span className="badge badge-sky mb-2" style={{ marginBottom: 8 }}>
            REAL‑TIME ATTENDANCE TERMINAL
          </span>
          <h2 className="text-2xl font-bold">Attendance &amp; QR scanner</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isExecutive
              ? "Scan worker QR badges with your camera or use the manual token fallback."
              : "Review your attendance and manage today's check‑in and check‑out."}
          </p>
        </div>
        {isExecutive && (
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="btn btn-sky inline-flex items-center gap-2 p-2 min-w-[44px] min-h-[44px]"
            disabled={scanLoading}
          >
            <Camera size={18} />
            {scanLoading ? "Processing…" : "Launch Camera Scanner"}
          </button>
        )}
      </div>

      {/* Worker Self Attendance */}
      {isWorker && (
        <div className="bento-card mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="badge badge-sky mb-2" style={{ marginBottom: 8 }}>
                YOUR ATTENDANCE
              </span>
              <h3 className="text-xl font-extrabold">
                {todayRecord
                  ? todayRecord.checkOut
                    ? "Today's attendance completed"
                    : "You are currently checked in"
                  : "You have not checked in today"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {todayRecord
                  ? `Check‑in: ${formatTime(todayRecord.checkIn)}`
                  : "Use the button below to record your check‑in."}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {!todayRecord && (
                <button
                  type="button"
                  className="btn btn-emerald inline-flex items-center gap-2 min-w-[44px] min-h-[44px]"
                  onClick={handleSelfCheckIn}
                  disabled={actionLoading}
                >
                  <Clock size={18} />
                  {actionLoading ? "Processing…" : "Check In"}
                </button>
              )}
              {todayRecord && !todayRecord.checkOut && (
                <button
                  type="button"
                  className="btn btn-sky inline-flex items-center gap-2 min-w-[44px] min-h-[44px]"
                  onClick={handleSelfCheckOut}
                  disabled={actionLoading}
                >
                  <Clock size={18} />
                  {actionLoading ? "Processing…" : "Check Out"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Executive QR Scanner Card */}
      {isExecutive && (
        <div
          className="bento-card attendance-scanner-card mb-7 p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="metric-icon icon-sky">
                <QrCode size={26} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold">Worker QR Verification</h3>
                <p className="text-sm text-gray-300 mt-1">Scan a worker's QR badge using your device camera.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="btn btn-emerald inline-flex items-center gap-2 min-w-[44px] min-h-[44px]"
              disabled={scanLoading}
            >
              <Camera size={20} />
              {scanLoading ? "Processing…" : "Open Camera Scanner"}
            </button>
          </div>
          {/* Manual fallback */}
          <form onSubmit={handleManualSubmit} className="mt-5 flex flex-wrap gap-3 pt-4 border-t border-white/10">
            <input
              type="text"
              className="input-field flex-1 min-w-[200px] p-2 rounded border border-gray-600 bg-gray-700 text-white"
              placeholder="Paste worker QR token…"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              disabled={scanLoading}
            />
            <button
              type="submit"
              className="btn btn-glass inline-flex items-center gap-2 min-w-[44px] min-h-[44px]"
              disabled={!manualToken.trim() || scanLoading}
            >
              <ShieldCheck size={18} />
              {scanLoading ? "Processing…" : "Process Token"}
            </button>
          </form>
        </div>
      )}

      {/* Feedback Message */}
      {scanMsg && (
        <div
          role="status"
          className={`attendance-feedback mb-5 p-3 rounded border text-base font-medium ${scanMsg.startsWith("❌") ? "error" : "success"}`}
        >
          {scanMsg}
        </div>
      )}

      {/* Attendance Table */}
      <div className="bento-card overflow-hidden rounded-lg shadow">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Search size={18} />
            <strong className="text-gray-800 dark:text-gray-200">
              {isExecutive ? "Employee Attendance" : "My Attendance"}
            </strong>
          </div>
          <button
            type="button"
            className="btn btn-glass p-2"
            onClick={fetchAttendance}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <div className="table-responsive overflow-x-auto" role="region" aria-label="Attendance records" tabIndex={0}>
          <table className="min-w-[800px] custom-table">
            <thead>
              <tr>
                <th>Date</th>
                {isExecutive && <th>Employee</th>}
                <th>Check‑in</th>
                <th>Check‑out</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isExecutive ? 6 : 5} className="attendance-empty text-center py-8">
                    Loading attendance records…
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={isExecutive ? 6 : 5} className="attendance-empty text-center py-8">
                    No attendance records logged.
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record._id} className="table-row">
                    <td className="font-semibold">{formatDate(record.date)}</td>
                    {isExecutive && (
                      <td>
                        <strong>{record.worker?.name || "Worker"}</strong>
                        <span className="block text-sm attendance-job-title mt-1">
                          {record.worker?.jobTitle || ""}
                        </span>
                      </td>
                    )}
                    <td>{formatTime(record.checkIn)}</td>
                    <td>{formatTime(record.checkOut)}</td>
                    <td>
                      <span className="badge badge-sky whitespace-nowrap">{record.checkInMethod || "QR"}</span>
                    </td>
                    <td>
                      <span className={getStatusClass(record.status) + " whitespace-nowrap inline-flex items-center"}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Camera QR Modal */}
      {isExecutive && (
        <CameraQRScannerModal
          isOpen={isCameraOpen}
          onClose={handleCloseCamera}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </div>
  );
}
