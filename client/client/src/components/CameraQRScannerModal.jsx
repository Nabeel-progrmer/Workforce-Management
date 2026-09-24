import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, ShieldCheck } from "lucide-react";

export default function CameraQRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [activeTab, setActiveTab] = useState("camera"); // "camera" | "upload"
  const [errorMsg, setErrorMsg] = useState("");
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helper: start camera using MediaDevices API with proper permissions handling
  const startCamera = async (cameraIdOrConstraint = null) => {
    try {
      setErrorMsg("");
      // Request permission first (helps on iOS Safari)
      await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (permErr) {
      console.warn("Camera permission denied or unavailable", permErr);
      setErrorMsg("Camera access denied. Use the file upload fallback.");
      return;
    }

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader-viewport");
      }

      // Stop any existing stream
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      const cameraConfig =
        cameraIdOrConstraint ||
        { facingMode: "environment" };

      await html5QrCodeRef.current.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
            return {
              width: Math.max(180, Math.min(size, 300)),
              height: Math.max(180, Math.min(size, 300))
            };
          },
          aspectRatio: 1.333333,
          videoConstraints: { facingMode: "environment" }
        },
        (decodedText) => {
          onScanSuccess(decodedText);
          stopCamera();
        },
        (errorMessage) => {
          // ignoring per‑frame errors
        }
      );
    } catch (err) {
      console.error("Camera start error:", err);
      setErrorMsg("Failed to start the camera. Use the file upload fallback.");
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

  // Open camera when modal becomes visible and the camera tab is active
  useEffect(() => {
    if (isOpen && activeTab === "camera") {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  // File‑input fallback – reads image and feeds it to Html5Qrcode manually
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
      // Html5Qrcode has a method "scanFile" for static images
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
      setErrorMsg("Failed to process the image file.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-full overflow-y-auto shadow-lg">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center space-x-2">
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
        <div className="p-4">
          {/* Tab selector */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab("camera")}
              className={`px-4 py-2 rounded ${activeTab === "camera" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700"}`}
            >
              Camera
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2 rounded ${activeTab === "upload" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700"}`}
            >
              Upload Image
            </button>
          </div>

          {errorMsg && (
            <p className="text-red-600 mb-2" role="alert">
              {errorMsg}
            </p>
          )}

          {/* Camera view */}
          {activeTab === "camera" && (
            <div id="qr-reader-viewport" className="w-full h-64" />
          )}

          {/* File upload fallback */}
          {activeTab === "upload" && (
            <div className="flex flex-col items-center">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="mt-2 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              <p className="mt-2 text-sm text-gray-500">
                Take a photo of a QR code or select an existing image.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
