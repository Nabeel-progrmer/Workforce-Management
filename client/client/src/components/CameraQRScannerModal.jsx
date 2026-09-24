import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Upload, X, ShieldCheck, RefreshCw, Aperture, Image as ImageIcon, Smartphone, Monitor, Video } from "lucide-react";

export default function CameraQRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [activeTab, setActiveTab] = useState("camera"); // "camera" | "upload"
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [scanning, setScanning] = useState(false);

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const scanLockedRef = useRef(false);

  // Device detection: Laptop (Front user cam) vs Mobile (Rear environment cam)
  const isMobile = typeof window !== "undefined" && (window.innerWidth <= 768 || /Android|iPhone|iPad/i.test(navigator.userAgent));
  const defaultFacing = isMobile ? "environment" : "user";
  // State for manual camera toggle (front/back)
  const [manualFacing, setManualFacing] = useState(null);

  const effectiveFacing = manualFacing || defaultFacing;

  useEffect(() => {
    if (isOpen && isMobile && activeTab === "camera") {
      startCamera();
    }
    // existing logic follows
    if (isOpen) {
      enumerateCameras();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const enumerateCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Default to first camera or back camera if mobile
        const backCam = devices.find((d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear"));
        setSelectedCameraId(backCam ? backCam.id : devices[0].id);
      }
    } catch (err) {
      console.warn("Camera enumeration notice:", err.message);
    }
  };

  const startCamera = async (cameraIdOrConstraint = null) => {
    try {
      setErrorMsg("");
      setScanResult("");
      scanLockedRef.current = false;

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader-viewport");
      }

      // If camera stream is active, stop it first
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      const cameraConfig = cameraIdOrConstraint || selectedCameraId || { facingMode: effectiveFacing };

      await html5QrCodeRef.current.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
            return { width: Math.max(180, Math.min(size, 300)), height: Math.max(180, Math.min(size, 300)) };
          },
          aspectRatio: 1.333333,
          videoConstraints: {
            facingMode: effectiveFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        (decodedText) => {
          if (scanLockedRef.current) return;
          scanLockedRef.current = true;
          setScanResult(decodedText);
          onScanSuccess(decodedText);
          stopCamera();
        },
        (errorMessage) => {
          // Frame miss callback
        }
      );

      setIsStreaming(true);
    } catch (err) {
      console.error("Camera start error:", err);
      setErrorMsg("Failed to start the camera. Please ensure permissions are granted and try toggling the camera mode.");
      setIsStreaming(false);
      // No further fallback; user can switch camera via toggle.
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }
    setIsStreaming(false);
    scanLockedRef.current = false;
  };

  const handleSnapSnapshot = async () => {
    const container = document.getElementById("qr-reader-viewport");
    if (!container) return;

    const videoEl = container.querySelector("video");
    if (!videoEl) {
      setErrorMsg("Video stream not active. Please start camera first.");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "snapshot.png", { type: "image/png" });
        try {
          const tempEngine = new Html5Qrcode("qr-file-temp");
          const text = await tempEngine.scanFile(file, true);
          setScanResult(text);
          onScanSuccess(text);
          stopCamera();
        } catch (scanErr) {
          setErrorMsg("Snapshot scan missed QR Code. Please align QR inside reticle or try uploading photo.");
        }
      }, "image/png");
    } catch (err) {
      setErrorMsg("Snapshot capture failed.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setScanResult("");

    try {
      setScanning(true);
      const tempEngine = new Html5Qrcode("qr-file-temp");
      const text = await tempEngine.scanFile(file, true);
      setScanResult(text);
      onScanSuccess(text);
    } catch (err) {
      setErrorMsg("Could not detect a valid QR Code in the uploaded image. Please choose a clearer QR photo.");
    } finally {
      setScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 540, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="metric-icon" style={{ width: 38, height: 38 }}><Camera size={20} /></div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)" }}>QR Scanner Terminal</h3>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="btn btn-outline btn-sm" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Scanner Tabs */}
        <div className="role-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === "camera" ? "active" : ""}`}
            onClick={() => { setActiveTab("camera"); setErrorMsg(""); }}
          >
            <Camera size={15} /> Live Camera Scanner
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => { setActiveTab("upload"); stopCamera(); setErrorMsg(""); }}
          >
            <Upload size={15} /> Upload QR Photo
          </button>
        </div>

        {/* Live Camera Scanner Viewport */}
        {activeTab === "camera" && (
          <div>
            <div
              className={`qr-reader-shell ${isStreaming ? "is-live" : ""}`}
              style={{ position: "relative", minHeight: 220, borderRadius: 16, overflow: "hidden", border: "2px solid var(--border-main)", background: "#000" }}
            >
              <div id="qr-reader-viewport" style={{ width: "100%", minHeight: 220 }} />
              {!isStreaming && (
                <div className="qr-reader-placeholder">
            {!isStreaming ? (
              <div style={{ padding: "28px 20px", background: "var(--bg-surface)", borderRadius: 16 }}>
                <Aperture size={48} style={{ color: "var(--text-primary)", marginBottom: 12 }} />
                <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                  Smart Hardware Camera Scanner
                </h4>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "8px 0 16px" }}>
                  {isMobile ? (
                    <span><Smartphone size={14} style={{ display: "inline", marginRight: 4 }} /> Mobile detected: Opening Rear Camera</span>
                  ) : (
                    <span><Monitor size={14} style={{ display: "inline", marginRight: 4 }} /> Laptop detected: Opening Front Selfie Webcam</span>
                  )}
                </p>

                {/* Camera Hardware Selector Dropdown */}
                {cameras.length > 1 && (
                  <div style={{ marginBottom: 16 }}>
                    <select
                      className="input-field"
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                    >
                      {cameras.map((c) => (
                        <option key={c.id} value={c.id}>
                          📷 {c.label || `Camera ${c.id}`}
                        </option>
                      ))}
                    </select>
                    {/* Manual front/back toggle */}
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ marginLeft: 8 }}
                      onClick={() => {
                        const newFacing = manualFacing === "environment" ? "user" : "environment";
                        setManualFacing(newFacing);
                        // Force re-select camera based on new facing mode
                        const matched = cameras.find((c) => c.label.toLowerCase().includes(newFacing));
                        if (matched) setSelectedCameraId(matched.id);
                      }}
                    >
                      Switch to {manualFacing === "environment" ? "Front" : "Rear"} Camera
                    </button>
                  </div>
                )}

                <button onClick={() => startCamera()} className="btn btn-black" style={{ width: "100%" }}>
                  <Video size={18} /> Open Camera Viewfinder
                </button>
              </div>
            ) : (
              <div />
            )}
                </div>
              )}
              {isStreaming && <div className="scanner-laser-beam" />}
            </div>
            {isStreaming && (
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={handleSnapSnapshot} className="btn btn-black" style={{ flex: 1 }}>
                  <Aperture size={18} /> Snap Photo & Scan
                </button>
                <button onClick={stopCamera} className="btn btn-outline" style={{ padding: "10px 16px" }}>
                  Stop Camera
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload QR Photo Tab */}
        {activeTab === "upload" && (
          <div style={{ padding: "32px 20px", background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-main)" }}>
            <ImageIcon size={48} style={{ color: "var(--text-primary)", marginBottom: 12 }} />
            <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>Upload QR Image / Gallery Photo</h4>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "8px 0 20px" }}>
              Select a QR Code photo file or mobile screenshot from disk/gallery.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />

            <button onClick={() => fileInputRef.current?.click()} disabled={scanning} className="btn btn-black" style={{ width: "100%" }}>
              <Upload size={18} /> {scanning ? "Scanning Photo..." : "Select QR Image File"}
            </button>
          </div>
        )}

        {/* Hidden temp element for decoding */}
        <div id="qr-file-temp" style={{ display: "none" }} />

        {errorMsg && (
          <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: "#f87171", background: "rgba(244, 63, 94, 0.1)", padding: 12, borderRadius: 10, border: "1px solid rgba(244, 63, 94, 0.3)" }}>
            {errorMsg}
          </div>
        )}

        {scanResult && (
          <div className="badge" style={{ marginTop: 16, padding: "10px 16px", display: "block" }}>
            <ShieldCheck size={16} style={{ display: "inline", marginRight: 4 }} />
            Decoded QR Token: {scanResult}
          </div>
        )}
      </div>
    </div>
  );
}
