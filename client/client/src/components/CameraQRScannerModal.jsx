import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Loader2 } from "lucide-react";

// Utility to detect mobile devices – used only for optional UI tweaks (e.g., larger tap targets).
function isMobileDevice() {
  if (typeof window === "undefined") return false;
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const smallViewport = window.matchMedia("(max-width: 768px)").matches;
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(
    navigator.userAgent || ""
  );
  return hasTouch || smallViewport || mobileUA;
}

export default function CameraQRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [activeTab, setActiveTab] = useState("camera"); // "camera" | "upload"
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingCam, setLoadingCam] = useState(false);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMobile = isMobileDevice();

  // -------------------------------------------------------
  // Request camera permission – mobile‑friendly fallback
  // -------------------------------------------------------
  const requestCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Stop immediately – we only needed the permission prompt
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch (e) {
      console.warn("Camera permission request failed", e);
      setErrorMsg(
        "Camera permission denied or not supported. Use the upload fallback."
      );
      return false;
    }
  };

  // -------------------------------------------------------
  // Start the QR scanner via html5‑qrcode
  // -------------------------------------------------------
  const startCamera = async (cameraIdOrConstraint = null) => {
    setErrorMsg("");
    setLoadingCam(true);
    // On mobile we explicitly ask for permission first (helps iOS)
    if (isMobile) {
      const granted = await requestCamera();
      if (!granted) {
        setLoadingCam(false);
        return;
      }
    }
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader-viewport");
      }
      // Stop any previous scan
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      const cameraConfig = cameraIdOrConstraint || { facingMode: "environment" };
      await html5QrCodeRef.current.start(
        cameraConfig,
        {
          fps: 12,
          qrbox: (vw, vh) => {
            const size = Math.floor(Math.min(vw, vh) * 0.7);
            return { width: size, height: size };
          },
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        (decodedText) => {
          onScanSuccess(decodedText);
          stopCamera();
        },
        (errorMessage) => {
          // ignore per‑frame errors – they are noisy but non‑fatal
        }
      );
    } catch (err) {
      console.error("Camera start error", err);
      setErrorMsg("Failed to start the camera. Try the upload fallback.");
    } finally {
      setLoadingCam(false);
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
  };

  // -------------------------------------------------------
  // File‑input fallback – scan a static image
  // -------------------------------------------------------
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader-viewport");
      }
      const result = await html5QrCodeRef.current.scanFile(dataUrl, true);
      if (result) {
        onScanSuccess(result);
        onClose();
      } else {
        setErrorMsg("No QR code detected in the image.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to read the image file.");
    }
  };

  // -------------------------------------------------------
  // Lifecycle – start when modal opens, stop on close
  // -------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      // Always start the camera (desktop) or the permission flow (mobile) when opened
      startCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  // --------------------
  // UI – a premium card‑like scanning modal
  // --------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-full overflow-hidden ring-1 ring-gray-200/30 backdrop-filter backdrop-blur-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-t-2xl">
          <h2 className="text-lg font-semibold flex items-center space-x-2 text-gray-800 dark:text-gray-100">
            <Camera size={20} />
            <span>QR Scanner</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>

        {/* Tab selector – same UI for both mobile & desktop (kept unchanged for mobile) */}
        <div className="flex space-x-2 p-4 pt-2">
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-2 rounded transition ${
              activeTab === "camera"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            }`}
          >
            Camera
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-2 rounded transition ${
              activeTab === "upload"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            }`}
          >
            Upload Image
          </button>
        </div>

        {errorMsg && (
          <p className="px-4 text-red-600" role="alert">
            {errorMsg}
          </p>
        )}

        {/* Camera viewport */}
        {activeTab === "camera" && (
          <div className="relative w-full h-64">
            {loadingCam && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            )}
            <div id="qr-reader-viewport" className="w-full h-full" />
          </div>
        )}

        {/* Upload fallback */}
        {activeTab === "upload" && (
          <div className="flex flex-col items-center p-4">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            <p className="mt-2 text-sm text-gray-500 text-center">
              Capture a photo of a QR code or choose an existing image.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
