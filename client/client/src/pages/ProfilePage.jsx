import React from "react";
import { User, QrCode, Shield, Mail, Phone, Building2, Calendar, Award } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../App";

export default function ProfilePage() {
  const { user } = useAuth();
  const qrTokenValue = user?.qrToken || `worker-${user?.id || user?._id || "demo"}`;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Employee Digital Profile & QR Badge</h2>
          <p>Verified employee security profile and official organization scannable QR card.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Profile Info Details */}
        <div className="bento-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 26, background: 'linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)' }}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc' }}>{user?.name}</h3>
              <span className="badge badge-violet">{user?.role?.toUpperCase()} ACCOUNT</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'rgba(12, 19, 34, 0.7)', borderRadius: 14 }}>
              <Mail size={18} style={{ color: '#38bdf8' }} />
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 700 }}>EMAIL ADDRESS</span>
                <strong style={{ fontSize: 14, color: '#f8fafc' }}>{user?.email}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'rgba(12, 19, 34, 0.7)', borderRadius: 14 }}>
              <Shield size={18} style={{ color: '#34d399' }} />
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 700 }}>EMPLOYEE ID CODE</span>
                <strong style={{ fontSize: 14, color: '#f8fafc' }}>{user?.employeeId || "EMP-WRK-101"}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'rgba(12, 19, 34, 0.7)', borderRadius: 14 }}>
              <Building2 size={18} style={{ color: '#fbbf24' }} />
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 700 }}>JOB TITLE & ROLE</span>
                <strong style={{ fontSize: 14, color: '#f8fafc' }}>{user?.jobTitle || "Employee"}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Employee ID Badge */}
        <div className="bento-card" style={{ background: 'linear-gradient(135deg, rgba(21, 32, 53, 0.95) 0%, rgba(12, 19, 34, 0.95) 100%)', border: '1px solid rgba(56, 189, 248, 0.35)', textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: '#38bdf8', textTransform: 'uppercase' }}>
            WORKFORCE ERP OFFICIAL BADGE
          </div>
          
          <div className="avatar" style={{ width: 80, height: 80, fontSize: 32, margin: '20px auto 16px', background: 'linear-gradient(135deg, #38bdf8 0%, #10b981 100%)', boxShadow: '0 8px 25px rgba(56, 189, 248, 0.4)' }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc' }}>{user?.name}</h3>
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 2 }}>{user?.jobTitle || "Worker"}</p>

          <div style={{ margin: '24px auto', padding: 16, background: '#fff', borderRadius: 16, width: 170, height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)' }}>
            <QRCodeSVG value={qrTokenValue} size={142} />
          </div>

          <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            TOKEN: {qrTokenValue}
          </span>
        </div>
      </div>
    </div>
  );
}
