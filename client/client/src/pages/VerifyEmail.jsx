import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function VerifyEmail() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ color: '#10b981', display: 'inline-flex', marginBottom: 16 }}>
          <CheckCircle2 size={64} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f3f4f6' }}>Email Verified!</h2>
        <p style={{ color: '#9ca3af', fontSize: 14, margin: '12px 0 24px' }}>
          Your worker account email verification is complete. You can now access all features.
        </p>
        <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
          Proceed to Login <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}