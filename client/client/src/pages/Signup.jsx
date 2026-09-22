import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Shield, Building2, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../App";
import api from "../api";
import WorkforceLogo from "../components/WorkforceLogo";

export default function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [activeRole, setActiveRole] = useState("worker");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    jobTitle: "",
    setupKey: "admin123"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fillDemoSignup = (roleType) => {
    setActiveRole(roleType);
    const rand = Math.floor(100 + Math.random() * 900);
    if (roleType === "ceo") {
      setForm({
        name: `CEO User ${rand}`,
        email: `ceo${rand}@workforce.com`,
        password: "password123",
        phone: "+1 (555) 019-9000",
        jobTitle: "Chief Executive Officer",
        setupKey: "admin123"
      });
    } else if (roleType === "manager") {
      setForm({
        name: `Manager User ${rand}`,
        email: `manager${rand}@workforce.com`,
        password: "password123",
        phone: "+1 (555) 018-8000",
        jobTitle: "Operations Manager",
        setupKey: "admin123"
      });
    } else {
      setForm({
        name: `Worker User ${rand}`,
        email: `worker${rand}@workforce.com`,
        password: "password123",
        phone: "+1 (555) 017-7000",
        jobTitle: "Software Developer",
        setupKey: ""
      });
    }
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Full Name, Email, and Password are required.");
      return;
    }

    if ((activeRole === "ceo" || activeRole === "manager") && !form.setupKey) {
      setError(`Setup Key is required to register as ${activeRole.toUpperCase()}.`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/signup", {
        ...form,
        role: activeRole
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <WorkforceLogo size={56} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Create Enterprise Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Select your organization role to setup your workspace
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="role-tabs">
          <button
            type="button"
            className={`tab-btn ${activeRole === 'worker' ? 'active' : ''}`}
            onClick={() => { setActiveRole('worker'); setError(''); }}
          >
            <User size={15} /> Worker
          </button>

          <button
            type="button"
            className={`tab-btn ${activeRole === 'manager' ? 'active' : ''}`}
            onClick={() => { setActiveRole('manager'); setError(''); }}
          >
            <Building2 size={15} /> Manager
          </button>

          <button
            type="button"
            className={`tab-btn ${activeRole === 'ceo' ? 'active' : ''}`}
            onClick={() => { setActiveRole('ceo'); setError(''); }}
          >
            <Shield size={15} /> CEO Setup
          </button>
        </div>

        {error && (
          <div className="badge badge-rose" style={{ display: 'block', padding: '10px 14px', marginBottom: 18, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              Full Name
            </label>
            <input name="name" className="input-field" placeholder="e.g. Alexander Wright" value={form.name} onChange={handleChange} required />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              Email Address
            </label>
            <input type="email" name="email" className="input-field" placeholder="you@workforce.com" value={form.email} onChange={handleChange} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                Job Title
              </label>
              <input name="jobTitle" className="input-field" placeholder={activeRole === 'ceo' ? 'CEO' : activeRole === 'manager' ? 'Manager' : 'Engineer'} value={form.jobTitle} onChange={handleChange} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                Phone Number
              </label>
              <input name="phone" className="input-field" placeholder="+1 (555) 000-0000" value={form.phone} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              Password
            </label>
            <input type="password" name="password" className="input-field" placeholder="••••••••" value={form.password} onChange={handleChange} required />
          </div>

          {(activeRole === "ceo" || activeRole === "manager") && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                Security Setup Key ({activeRole.toUpperCase()})
              </label>
              <input name="setupKey" className="input-field" placeholder="admin123" value={form.setupKey} onChange={handleChange} required />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-black" style={{ width: '100%', padding: '13px', marginTop: 8 }}>
            {loading ? "Registering Account..." : <>Register as {activeRole.toUpperCase()} <ArrowRight size={18} /></>}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          Already registered?{" "}
          <Link to="/login" style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}>
            Sign In Here
          </Link>
        </div>

        {/* Demo Quick Auto-Fill */}
        <div className="demo-shortcuts">
          <p><Sparkles size={13} style={{ display: 'inline', marginRight: 4 }} /> Instant Signup Auto-Fill</p>
          <div className="demo-buttons">
            <button type="button" onClick={() => fillDemoSignup("worker")} className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>
              Fill Worker
            </button>
            <button type="button" onClick={() => fillDemoSignup("manager")} className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>
              Fill Manager
            </button>
            <button type="button" onClick={() => fillDemoSignup("ceo")} className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>
              Fill CEO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}