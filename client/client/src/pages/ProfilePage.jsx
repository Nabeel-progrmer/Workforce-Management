import React, { useRef, useState } from "react";
import { Building2, Camera, Mail, Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../App";
import api from "../api";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(user?.profileImage || "");
  const [selectedImage, setSelectedImage] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoError, setPhotoError] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const qrTokenValue = user?.qrToken || `worker-${user?.id || user?._id || "demo"}`;

  const handleImageSelection = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setPhotoError(true);
      setPhotoMessage("Please choose an image file.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setPhotoError(true);
      setPhotoMessage("Photo must be 1 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setImagePreview(dataUrl);
      setSelectedImage(dataUrl);
      setPhotoError(false);
      setPhotoMessage("Photo ready. Save it to update your profile.");
    };
    reader.onerror = () => {
      setPhotoError(true);
      setPhotoMessage("Could not read this photo. Please choose another one.");
    };
    reader.readAsDataURL(file);
  };

  const saveProfilePhoto = async () => {
    if (!selectedImage || savingPhoto) return;
    try {
      setSavingPhoto(true);
      const response = await api.patch("/workforce/profile/photo", { profileImage: selectedImage });
      const updatedUser = response.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setImagePreview(updatedUser.profileImage || selectedImage);
      }
      setSelectedImage("");
      setPhotoError(false);
      setPhotoMessage("Profile photo saved.");
    } catch (error) {
      setPhotoError(true);
      setPhotoMessage(error.response?.data?.message || "Could not save your photo. Please try again.");
    } finally {
      setSavingPhoto(false);
    }
  };

  const renderAvatar = (size, fontSize, extraStyle = {}) => (
    <div className="avatar profile-avatar" style={{ width: size, height: size, fontSize, ...extraStyle }}>
      {imagePreview ? <img src={imagePreview} alt={`${user?.name || "User"} profile`} /> : user?.name?.charAt(0)?.toUpperCase() || "U"}
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
            {renderAvatar(64, 26, { background: 'linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)' })}
            <div>
              <h3>{user?.name}</h3>
              <span className="badge badge-violet">{user?.role?.toUpperCase()} ACCOUNT</span>
            </div>
          </div>

          <div className="profile-photo-controls">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleImageSelection}
              hidden
            />
            <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
              <Camera size={17} /> Choose profile photo
            </button>
            <span className="profile-photo-hint">JPG, PNG, WEBP or GIF - maximum 1 MB</span>
            {selectedImage && (
              <button type="button" className="btn btn-black" onClick={saveProfilePhoto} disabled={savingPhoto}>
                {savingPhoto ? "Saving photo..." : "Save photo"}
              </button>
            )}
            {photoMessage && <p className={photoError ? "profile-photo-message error" : "profile-photo-message"} role="status">{photoMessage}</p>}
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
          
          {renderAvatar(80, 32, { margin: '20px auto 16px', background: 'linear-gradient(135deg, #38bdf8 0%, #10b981 100%)', boxShadow: '0 8px 25px rgba(56, 189, 248, 0.4)' })}

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
