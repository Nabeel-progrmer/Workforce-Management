import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Clock, QrCode, RefreshCw, Search, ShieldCheck, Upload } from "lucide-react";
import jsQR from "jsqr";
import { useAuth } from "../App";
import api from "../api";
import CameraQRScannerModal from "../components/CameraQRScannerModal";

// ---- Constants -----------------------------------------------------------
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

// ---- Utility Functions ----------------------------------------------------
const getErrorMessage = (error, fallback = "Something went wrong.") =>
  error?.response?.data?.message || error?.message || fallback;

const isWithinLast24Hours = (record) => {
  const timestamp = record?.checkIn || record?.createdAt;
  if (!timestamp) return false;
  const time = new Date(timestamp).getTime();
  return Number.isFinite(time) && Date.now() - time < TWENTY_FOUR_HOURS;
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
};

const statusClass = (status) =>
  status === "Completed" ? "badge badge-emerald" : "badge badge-amber";

// ---- Main Component -------------------------------------------------------
export default function AttendancePage() {
  // ----- Auth & Role -----------------------------------------------------
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "";
  const isExecutive = role === "ceo" || role === "manager";
  const isWorker = role === "worker";

  // ----- Local State ------------------------------------------------------
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [message, setMessage] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef(null);

  // ----- Data Fetch -------------------------------------------------------
  const fetchAttendance = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setMessage("");
      const endpoint = isExecutive ? "/workforce/attendance" : "/workforce/attendance/my";
      const response = await api.get(endpoint);
      const records = Array.isArray(response.data?.attendance)
        ? response.data.attendance
        : [];
      setAttendance(records);
    } catch (error) {
      console.error("Fetch attendance error:", error);
      setMessage(`❌ ${getErrorMessage(error, "Unable to load attendance.")}`);
    } finally {
      setLoading(false);
    }
  }, [user, isExecutive]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // ----- Filtering (last 24h) --------------------------------------------
  const visibleAttendance = useMemo(
    () => attendance.filter(isWithinLast24Hours),
    [attendance]
  );

  // ----- Current worker's active record -----------------------------------
  const currentWorkerRecord = useMemo(() => {
    if (!isWorker) return null;
    return (
      visibleAttendance.find(
        (record) =>
          String(record.worker?._id || record.worker) ===
          String(user?._id || user?.id)
      ) || visibleAttendance[0] ||
      null
    );
  }, [visibleAttendance, isWorker, user]);

  // ----- Worker actions ----------------------------------------------------
  const handleSelfCheckIn = async () => {
    if (!isWorker || actionLoading) return;
    try {
      setActionLoading(true);
      setMessage("");
      const response = await api.post("/workforce/attendance/check-in");
      setMessage(`✅ ${response.data?.message || "Check‑in successful."}`);
      await fetchAttendance();
    } catch (error) {
      console.error("Self check‑in error:", error);
      setMessage(`❌ ${getErrorMessage(error, "Unable to check in.")}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelfCheckOut = async () => {
    if (!isWorker || actionLoading) return;
    try {
      setActionLoading(true);
      setMessage("");
      const response = await api.post("/workforce/attendance/check-out");
      setMessage(`✅ ${response.data?.message || "Check‑out successful."}`);
      await fetchAttendance();
    } catch (error) {
      console.error("Self check‑out error:", error);
      setMessage(`❌ ${getErrorMessage(error, "Unable to check out.")}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ----- QR processing (executive only) ------------------------------------
  const processScanToken = async (rawToken) => {
    const token = String(rawToken || "").trim();
    if (!token) {
      setMessage("❌ No valid QR token was found.");
      return;
    }
    if (!isExecutive) {
      setMessage("❌ Only CEO or Manager can scan worker QR codes.");
      return;
    }
    if (scanLoading) return;
    try {
      setScanLoading(true);
      setMessage("");
      const response = await api.post("/workforce/attendance/check-in", { qrToken: token });
      setMessage(`✅ ${response.data?.message || "Worker attendance recorded successfully."}`);
      setManualToken("");
      await fetchAttendance();
    } catch (error) {
      console.error("QR check‑in error:", error);
      setMessage(`❌ ${getErrorMessage(error, "Invalid or unrecognized QR code.")}`);
    } finally {
      setScanLoading(false);
    }
  };

  const handleCameraScan = async (token) => {
    setIsCameraOpen(false);
    await processScanToken(token);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      setMessage("❌ Please enter a QR token.");
      return;
    }
    await processScanToken(manualToken);
  };

  // ----- QR image upload ---------------------------------------------------
  const handleQRUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!isExecutive) {
      setMessage("❌ Only CEO or Manager can upload worker QR codes.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setMessage("❌ Please upload a valid image.");
      return;
    }
    setScanLoading(true);
    setMessage("");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1800;
          let { naturalWidth: w, naturalHeight: h } = img;
          if (w > maxDim || h > maxDim) {
            const scale = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) throw new Error("Canvas not supported");
          ctx.drawImage(img, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          const result = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: "attemptBoth",
          });
          if (!result?.data) {
            setMessage("❌ No readable QR code found in this image.");
            setScanLoading(false);
            return;
          }
          setScanLoading(false);
          processScanToken(result.data);
        } catch (err) {
          console.error("QR upload processing error:", err);
          setMessage("❌ Could not process this QR image.");
          setScanLoading(false);
        }
      };
      img.onerror = () => {
        setMessage("❌ Could not open the uploaded image.");
        setScanLoading(false);
      };
      img.src = reader.result;
    };
    reader.onerror = () => {
      setMessage("❌ Could not read the uploaded image.");
      setScanLoading(false);
    };
    reader.readAsDataURL(file);
  };

  // ----- Render ------------------------------------------------------------
  return (
    <div className="attendance-page" style={{ width: "100%", maxWidth: "100%" }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ minWidth: 0 }}>
          <span className="badge badge-sky" style={{ marginBottom: 8 }}>
            REAL‑TIME ATTENDANCE
          </span>
          <h2>Attendance Log & QR Scanner</h2>
          <p>
            {isExecutive
              ? "Scan worker QR badges with your camera or upload a QR image."
              : "Manage your check‑in, check‑out and recent attendance."}
          </p>
        </div>
        {isExecutive && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-sky"
              onClick={() => setIsCameraOpen(true)}
              disabled={scanLoading}
            >
              <Camera size={18} /> Open Camera
            </button>
            <label
              className="btn btn-glass"
              style={{
                cursor: scanLoading ? "not-allowed" : "pointer",
                opacity: scanLoading ? 0.6 : 1,
              }}
            >
              <Upload size={18} /> Upload QR
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={scanLoading}
                onChange={handleQRUpload}
                ref={fileInputRef}
              />
            </label>
          </div>
        )}
      </div>

      {/* Worker Self‑Attendance */}
      {isWorker && (
        <div className="bento-card" style={{ marginBottom: 24, padding: 24 }}>
          <span className="badge badge-sky" style={{ marginBottom: 8 }}>
            MY ATTENDANCE
          </span>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
            {currentWorkerRecord
              ? currentWorkerRecord.checkOut
                ? "Today's attendance completed"
                : "You are currently checked in"
              : "You are not checked in"}
          </h3>
          <p style={{ marginTop: 6, color: "var(--text-muted)" }}>
            {currentWorkerRecord
              ? `Check‑in: ${formatTime(currentWorkerRecord.checkIn)}${
                  currentWorkerRecord.checkOut
                    ? ` • Check‑out: ${formatTime(currentWorkerRecord.checkOut)}`
                    : ""
                }`
              : "Use the button below to check in."}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            {!currentWorkerRecord && (
              <button
                type="button"
                className="btn btn-emerald"
                onClick={handleSelfCheckIn}
                disabled={actionLoading}
              >
                <Clock size={18} />
                {actionLoading ? "Processing..." : "Check In"}
              </button>
            )}
            {currentWorkerRecord && !currentWorkerRecord.checkOut && (
              <button
                type="button"
                className="btn btn-sky"
                onClick={handleSelfCheckOut}
                disabled={actionLoading}
              >
                <Clock size={18} />
                {actionLoading ? "Processing..." : "Check Out"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Executive QR Card */}
      {isExecutive && (
        <div
          className="bento-card"
          style={{
            marginBottom: 24,
            background: "linear-gradient(135deg, rgba(12,19,34,.96), rgba(21,32,53,.92))",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                minWidth: 0,
              }}
            >
              <div className="metric-icon icon-sky">
                <QrCode size={25} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#f8fafc",
                  }}
                >
                  Worker QR Verification
                </h3>
                <p
                  style={{
                    marginTop: 4,
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  Scan a worker badge or upload a QR image.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-emerald"
                onClick={() => setIsCameraOpen(true)}
                disabled={scanLoading}
              >
                <Camera size={19} /> Camera
              </button>
              <label
                className="btn btn-glass"
                style={{
                  cursor: scanLoading ? "not-allowed" : "pointer",
                  opacity: scanLoading ? 0.6 : 1,
                }}
              >
                <Upload size={18} /> Upload QR
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={scanLoading}
                  onChange={handleQRUpload}
                />
              </label>
            </div>
          </div>

          {/* Manual token input */}
          <form
            onSubmit={handleManualSubmit}
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,.08)",
            }}
          >
            <input
              type="text"
              className="input-field"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Paste worker QR token..."
              disabled={scanLoading}
              autoComplete="off"
              style={{ flex: "1 1 280px", minWidth: 0, maxWidth: "100%" }}
            />
            <button
              type="submit"
              className="btn btn-glass"
              disabled={scanLoading || !manualToken.trim()}
            >
              <ShieldCheck size={18} />
              {scanLoading ? "Processing..." : "Process Token"}
            </button>
          </form>
        </div>
      )}

      {/* Global Message */}
      {message && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginBottom: 20,
            padding: "12px 14px",
            borderRadius: 12,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-main)",
            color: message.startsWith("❌") ? "#f87171" : "#34d399",
            fontWeight: 700,
            overflowWrap: "anywhere",
          }}
        >
          {message}
        </div>
      )}

      {/* Attendance Table */}
      <div className="bento-card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            padding: "18px 20px",
            borderBottom: "1px solid var(--border-main)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Search size={18} />
            <strong>{isExecutive ? "Recent Employee Attendance" : "My Recent Attendance"}</strong>
          </div>
          <button
            type="button"
            className="btn btn-glass"
            onClick={fetchAttendance}
            disabled={loading}
            style={{ padding: "8px 12px" }}
          >
            <RefreshCcw size={15} /> {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div
          className="table-responsive"
          style={{
            width: "100%",
            maxWidth: "100%",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <table className="custom-table">
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
                  <td
                    colSpan={isExecutive ? 6 : 5}
                    style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}
                  >
                    Loading attendance...
                  </td>
                </tr>
              ) : visibleAttendance.length === 0 ? (
                <tr>
                  <td
                    colSpan={isExecutive ? 6 : 5}
                    style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}
                  >
                    No attendance records from the last 24 hours.
                  </td>
                </tr>
              ) : (
                visibleAttendance.map((record) => (
                  <tr key={record._id} className="table-row">
                    <td style={{ fontWeight: 700 }}>{formatDate(record.date)}</td>
                    {isExecutive && (
                      <td>
                        <strong style={{ color: "#f8fafc" }}>
                          {record.worker?.name || "Worker"}
                        </strong>
                        <span
                          style={{
                            display: "block",
                            marginTop: 2,
                            fontSize: 12,
                            color: "#94a3b8",
                          }}
                        >
                          {record.worker?.jobTitle || ""}
                        </span>
                      </td>
                    )}
                    <td>{formatTime(record.checkIn)}</td>
                    <td>{formatTime(record.checkOut)}</td>
                    <td>
                      <span className="badge badge-sky">{record.checkInMethod || "ONLINE"}</span>
                    </td>
                    <td>
                      <span className={statusClass(record.status)}>{record.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Camera Modal */}
      {isExecutive && (
        <CameraQRScannerModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onScanSuccess={handleCameraScan}
        />
      )}
    </div>
  );
}