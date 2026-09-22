import React, { useEffect, useState } from "react";
import WorkforceLogo from "./WorkforceLogo";

export default function Loader({ fullscreen = true, text = "" }) {
  const [stepIndex, setStepIndex] = useState(0);

  const loadingSteps = [
    "Authenticating Enterprise Session...",
    "Connecting Security Protocols...",
    "Loading Workforce Engine...",
    "Mounting Role-Based Workspaces..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="app-loader"
      style={{
        minHeight: fullscreen ? "100vh" : "340px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-main)",
        gap: 20,
        padding: 24
      }}
    >
      <div className="loader-brand-lockup">
        <div className="loader-logo-stage">
          <div className="loader-orbital-ring" />
          <div className="loader-orbital-dot" />
          <WorkforceLogo size={72} className="loader-logo" />
        </div>
        <div className="loader-brand-name">WORKFORCE</div>
        <div className="loader-brand-caption">ENTERPRISE OPERATIONS</div>
      </div>

      <div className="loader-copy">
        <h3>Preparing your workspace</h3>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginTop: 6 }}>
          {text || loadingSteps[stepIndex]}
        </p>

        <div className="loader-progress-track">
          <div className="loader-progress-fill" />
        </div>
        <span className="loader-secure-label">SECURE SYSTEM INITIALIZATION</span>
      </div>
    </div>
  );
}