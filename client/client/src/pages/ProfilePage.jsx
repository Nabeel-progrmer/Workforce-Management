import React, { useState } from "react";
import { Building2, Mail, Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../App";
import api from "../api";
import { getProfileAvatar, PROFILE_AVATARS } from "../constants/profileAvatars";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [selectedAvatarId, setSelectedAvatarId] = useState(getProfileAvatar(user?.avatarId).id);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [avatarError, setAvatarError] = useState(false);
  const qrTokenValue = user?.qrToken || `worker-${user?.id || user?._id || "demo"}`;
  const selectedAvatar = getProfileAvatar(selectedAvatarId);
  const savedAvatarId = getProfileAvatar(user?.avatarId).id;

  const saveProfileAvatar = async () => {
    if (selectedAvatarId === savedAvatarId || savingAvatar) return;
    try {
      setSavingAvatar(true);
      const response = await api.patch("/workforce/profile/avatar", { avatarId: selectedAvatarId });
      const updatedUser = response.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      setAvatarError(false);
      setAvatarMessage("Avatar saved to your profile.");
    } catch (error) {
      setAvatarError(true);
      setAvatarMessage(error.response?.data?.message || "Could not save your avatar. Please try again.");
    } finally {
      setSavingAvatar(false);
    }
  };

  const renderAvatar = (size, extraStyle = {}) => (
    <div className="avatar profile-avatar" style={{ width: size, height: size, fontSize: size * 0.48, background: selectedAvatar.background, ...extraStyle }} aria-hidden="true">
      <selectedAvatar.Icon size={Math.round(size * 0.52)} strokeWidth={1.8} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Employee Digital Profile & QR Badge</h2>
          <p>Verified employee security profile and official organization scannable QR card.</p>
        </div>
      </div>

      <div className="dashboard-card-grid profile-card-grid">
        {/* Profile Info Details */}
        <div className="bento-card profile-details-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            {renderAvatar(64)}
            <div>
              <h3>{user?.name}</h3>
              <span className="badge badge-violet">{user?.role?.toUpperCase()} ACCOUNT</span>
            </div>
          </div>

          <div className="profile-avatar-picker">
            <p>Choose your profile avatar</p>
          <div className="profile-avatar-options" role="group" aria-label="Choose a profile avatar">
            {PROFILE_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  className={`profile-avatar-option ${selectedAvatarId === avatar.id ? "selected" : ""}`}
                  style={{ "--avatar-background": avatar.background }}
                  aria-label={`${avatar.label} avatar`}
                  aria-pressed={selectedAvatarId === avatar.id}
                  onClick={() => { setSelectedAvatarId(avatar.id); setAvatarMessage(""); }}
              >
                <avatar.Icon size={24} strokeWidth={1.8} />
              </button>
            ))}
            </div>
            <span className="profile-avatar-hint">Selected: {selectedAvatar.label}</span>
            {selectedAvatarId !== savedAvatarId && (
              <button type="button" className="btn btn-black" onClick={saveProfileAvatar} disabled={savingAvatar}>
                {savingAvatar ? "Saving avatar..." : "Save avatar"}
              </button>
            )}
            {avatarMessage && <p className={avatarError ? "profile-avatar-message error" : "profile-avatar-message"} role="status">{avatarMessage}</p>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="profile-info-row">
              <Mail size={18} style={{ color: '#38bdf8' }} />
              <div>
                <span className="profile-info-label">EMAIL ADDRESS</span>
                <strong>{user?.email}</strong>
              </div>
            </div>

            <div className="profile-info-row">
              <Shield size={18} style={{ color: '#34d399' }} />
              <div>
                <span className="profile-info-label">EMPLOYEE ID CODE</span>
                <strong>{user?.employeeId || "EMP-WRK-101"}</strong>
              </div>
            </div>

            <div className="profile-info-row">
              <Building2 size={18} style={{ color: '#fbbf24' }} />
              <div>
                <span className="profile-info-label">JOB TITLE & ROLE</span>
                <strong>{user?.jobTitle || "Employee"}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Employee ID Badge */}
        <div className="bento-card" style={{ background: 'linear-gradient(135deg, rgba(21, 32, 53, 0.95) 0%, rgba(12, 19, 34, 0.95) 100%)', border: '1px solid rgba(56, 189, 248, 0.35)', textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: '#38bdf8', textTransform: 'uppercase' }}>
            WORKFORCE ERP OFFICIAL BADGE
          </div>
          
          {renderAvatar(80, { margin: '20px auto 16px', boxShadow: '0 8px 25px rgba(56, 189, 248, 0.4)' })}

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
