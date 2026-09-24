import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Clock, QrCode, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "../App";
import api from "../api";
import CameraQRScannerModal from "../components/CameraQRScannerModal";
import "./AttendancePage.css";

const getErrorMessage = (error, fallback = "Something went wrong.") => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const isMobileDevice = () => {
  if (typeof window === "undefined") return false;

  const hasTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;

  const smallViewport = window.matchMedia("(max-width: 768px)").matches;

  const mobileUA =
    /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(
      navigator.userAgent || ""
    );

  return hasTouch || smallViewport || mobileUA;
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
  const [isMobile, setIsMobile] = useState(false);

  const autoCameraOpenedRef = useRef(false);

  const role = user?.role?.toLowerCase() || "";

  const isExecutive = useMemo(
    () => ["ceo", "manager"].includes(role),
    [role]
  );

  const isWorker = role === "worker";

  /* ---------------------------------------------
     Detect mobile responsively
  --------------------------------------------- */
  useEffect(() => {
    const updateMobileState = () => {
      setIsMobile(isMobileDevice());
    };

    updateMobileState();

    window.addEventListener("resize", updateMobileState);

    return () => {
      window.removeEventListener("resize", updateMobileState);
    };
  }, []);

  /* ---------------------------------------------
     Fetch attendance
  --------------------------------------------- */
  const fetchAttendance = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const endpoint = isExecutive
        ? "/workforce/attendance"
        : "/workforce/attendance/my";

      const res = await api.get(endpoint);

      if (res.data?.success) {
        setAttendance(res.data.attendance || []);
      } else {
        setAttendance([]);
      }
    } catch (error) {
      console.error("Attendance fetch error:", error);

      setScanMsg(
        getErrorMessage(
          error,
          "Unable to load attendance records."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [user, isExecutive]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  /* ---------------------------------------------
     Mobile executive camera
     Opens only once.
  --------------------------------------------- */
  useEffect(() => {
    if (!user || !isExecutive || !isMobile) return;

    if (!autoCameraOpenedRef.current) {
      autoCameraOpenedRef.current = true;
      setIsCameraOpen(true);
    }
  }, [user, isExecutive, isMobile]);

  /* ---------------------------------------------
     Today's attendance for current worker
  --------------------------------------------- */
  const todayRecord = useMemo(() => {
    if (!isWorker) return null;

    const today = getTodayKey();

    return (
      attendance.find((record) => record.date === today) || null
    );
  }, [attendance, isWorker]);

  /* ---------------------------------------------
     Worker self check-in
  --------------------------------------------- */
  const handleSelfCheckIn = async () => {
    if (!isWorker || actionLoading) return;

    try {
      setActionLoading(true);
      setScanMsg("");

      const res = await api.post(
        "/workforce/attendance/check-in"
      );

      setScanMsg(
        `✅ ${
          res.data?.message || "Check-in recorded successfully."
        }`
      );

      await fetchAttendance();
    } catch (error) {
      console.error("Self check-in error:", error);

      setScanMsg(
        `❌ ${getErrorMessage(
          error,
          "Unable to record check-in."
        )}`
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ---------------------------------------------
     Worker self check-out
  --------------------------------------------- */
  const handleSelfCheckOut = async () => {
    if (!isWorker || actionLoading) return;

    try {
      setActionLoading(true);
      setScanMsg("");

      const res = await api.post(
        "/workforce/attendance/check-out"
      );

      setScanMsg(
        `✅ ${
          res.data?.message || "Check-out recorded successfully."
        }`
      );

      await fetchAttendance();
    } catch (error) {
      console.error("Self check-out error:", error);

      setScanMsg(
        `❌ ${getErrorMessage(
          error,
          "Unable to record check-out."
        )}`
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ---------------------------------------------
     Executive QR scan
  --------------------------------------------- */
  const processScanToken = async (tokenString) => {
    const token = String(tokenString || "").trim();

    if (!token || scanLoading) return;

    if (!isExecutive) {
      setScanMsg(
        "❌ Only CEO or Manager accounts can scan worker QR badges."
      );
      return;
    }

    try {
      setScanLoading(true);
      setScanMsg("");

      const res = await api.post(
        "/workforce/attendance/check-in",
        {
          qrToken: token
        }
      );

      setScanMsg(
        `✅ ${
          res.data?.message ||
          "Attendance check-in completed successfully."
        }`
      );

      setManualToken("");

      await fetchAttendance();
    } catch (error) {
      console.error("QR attendance error:", error);

      setScanMsg(
        `❌ ${getErrorMessage(
          error,
          "Invalid or unrecognized QR token."
        )}`
      );
    } finally {
      setScanLoading(false);
    }
  };

  /* ---------------------------------------------
     Manual executive token submission
  --------------------------------------------- */
  const handleManualSubmit = async (event) => {
    event.preventDefault();

    const token = manualToken.trim();

    if (!token || scanLoading) return;

    await processScanToken(token);
  };

  /* ---------------------------------------------
     QR modal success
  --------------------------------------------- */
  const handleScanSuccess = async (token) => {
    setIsCameraOpen(false);

    if (!token) {
      setScanMsg("❌ No QR token was detected.");
      return;
    }

    await processScanToken(token);
  };

  /* ---------------------------------------------
     Close camera
  --------------------------------------------- */
  const handleCloseCamera = () => {
    setIsCameraOpen(false);
  };

  const getStatusClass = (status) => {
    return status === "Completed"
      ? "badge badge-emerald"
      : "badge badge-amber";
  };

  const formatTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="attendance-page">
      {/* -----------------------------------------
          Header
      ------------------------------------------ */}
      <div className="page-header">
        <div>
          <span
            className="badge badge-sky"
            style={{ marginBottom: 8 }}
          >
            REAL-TIME ATTENDANCE TERMINAL
          </span>

          <h2>Attendance Log & QR Scanner</h2>

          <p>
            {isExecutive
              ? "Scan worker QR badges with your camera or use the manual token fallback."
              : "Review your attendance and manage today's check-in and check-out."}
          </p>
        </div>

        {isExecutive && (
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="btn btn-sky"
            disabled={scanLoading}
          >
            <Camera size={18} />
            {scanLoading
              ? "Processing..."
              : "Launch Camera Scanner"}
          </button>
        )}
      </div>

      {/* -----------------------------------------
          Worker Self Attendance
      ------------------------------------------ */}
      {isWorker && (
        <div
          className="bento-card"
          style={{
            marginBottom: 24,
            padding: 24
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap"
            }}
          >
            <div>
              <span
                className="badge badge-sky"
                style={{ marginBottom: 8 }}
              >
                YOUR ATTENDANCE
              </span>

              <h3
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800
                }}
              >
                {todayRecord
                  ? todayRecord.checkOut
                    ? "Today's attendance completed"
                    : "You are currently checked in"
                  : "You have not checked in today"}
              </h3>

              <p
                style={{
                  marginTop: 6,
                  color: "var(--text-muted)",
                  fontSize: 13
                }}
              >
                {todayRecord
                  ? `Check-in: ${formatTime(todayRecord.checkIn)}`
                  : "Use the button below to record your check-in."}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap"
              }}
            >
              {!todayRecord && (
                <button
                  type="button"
                  className="btn btn-emerald"
                  onClick={handleSelfCheckIn}
                  disabled={actionLoading}
                >
                  <Clock size={18} />

                  {actionLoading
                    ? "Processing..."
                    : "Check In"}
                </button>
              )}

              {todayRecord &&
                !todayRecord.checkOut && (
                  <button
                    type="button"
                    className="btn btn-sky"
                    onClick={handleSelfCheckOut}
                    disabled={actionLoading}
                  >
                    <Clock size={18} />

                    {actionLoading
                      ? "Processing..."
                      : "Check Out"}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------
          Executive QR Scanner
      ------------------------------------------ */}
      {isExecutive && (
        <div
          className="bento-card"
          style={{
            marginBottom: 28,
            background:
              "linear-gradient(135deg, rgba(12, 19, 34, 0.96) 0%, rgba(21, 32, 53, 0.92) 100%)"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                minWidth: 0
              }}
            >
              <div className="metric-icon icon-sky">
                <QrCode size={26} />
              </div>

              <div style={{ minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#f8fafc"
                  }}
                >
                  Worker QR Verification
                </h3>

                <p
                  style={{
                    fontSize: 13,
                    color: "#94a3b8",
                    marginTop: 4,
                    lineHeight: 1.5
                  }}
                >
                  Scan a worker's QR badge using your device camera.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="btn btn-emerald"
              style={{
                padding: "12px 20px"
              }}
              disabled={scanLoading}
            >
              <Camera size={20} />

              {scanLoading
                ? "Processing..."
                : "Open Camera Scanner"}
            </button>
          </div>

          {/* Manual fallback */}
          <form
            onSubmit={handleManualSubmit}
            style={{
              marginTop: 20,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              paddingTop: 16,
              borderTop:
                "1px solid rgba(255, 255, 255, 0.08)"
            }}
          >
            <input
              type="text"
              className="input-field"
              placeholder="Paste worker QR token..."
              value={manualToken}
              onChange={(event) =>
                setManualToken(event.target.value)
              }
              disabled={scanLoading}
              autoComplete="off"
              style={{
                flex: "1 1 280px",
                minWidth: 0
              }}
            />

            <button
              type="submit"
              className="btn btn-glass"
              disabled={!manualToken.trim() || scanLoading}
            >
              <ShieldCheck size={18} />

              {scanLoading
                ? "Processing..."
                : "Process Token"}
            </button>
          </form>
        </div>
      )}

      {/* -----------------------------------------
          Feedback
      ------------------------------------------ */}
      {scanMsg && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginBottom: 20,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid var(--border-main)",
            background: "var(--bg-surface)",
            fontSize: 14,
            fontWeight: 700,
            color: scanMsg.startsWith("❌")
              ? "#f87171"
              : "#34d399"
          }}
        >
          {scanMsg}
        </div>
      )}

      {/* -----------------------------------------
          Attendance Table
      ------------------------------------------ */}
      <div
        className="bento-card"
        style={{
          padding: 0,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom:
              "1px solid var(--border-main)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10
            }}
          >
            <Search size={18} />
            <strong>
              {isExecutive
                ? "Employee Attendance"
                : "My Attendance"}
            </strong>
          </div>

          <button
            type="button"
            className="btn btn-glass"
            onClick={fetchAttendance}
            disabled={loading}
            style={{
              padding: "8px 12px"
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div
          className="table-responsive"
          style={{
            width: "100%",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch"
          }}
        >
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
              {loading ? (
                <tr>
                  <td
                    colSpan={isExecutive ? 6 : 5}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "#94a3b8"
                    }}
                  >
                    Loading attendance records...
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td
                    colSpan={isExecutive ? 6 : 5}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "#94a3b8"
                    }}
                  >
                    No attendance records logged.
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr
                    key={record._id}
                    className="table-row"
                  >
                    <td
                      style={{
                        fontWeight: 700
                      }}
                    >
                      {formatDate(record.date)}
                    </td>

                    {isExecutive && (
                      <td>
                        <strong
                          style={{
                            color: "#f8fafc"
                          }}
                        >
                          {record.worker?.name || "Worker"}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            fontSize: 12,
                            color: "#94a3b8",
                            marginTop: 2
                          }}
                        >
                          {record.worker?.jobTitle || ""}
                        </span>
                      </td>
                    )}

                    <td>
                      {formatTime(record.checkIn)}
                    </td>

                    <td>
                      {formatTime(record.checkOut)}
                    </td>

                    <td>
                      <span className="badge badge-sky">
                        {record.checkInMethod || "QR"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          record.status
                        )}
                      >
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

      {/* -----------------------------------------
          Camera QR Modal
      ------------------------------------------ */}
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