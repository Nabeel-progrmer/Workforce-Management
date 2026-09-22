import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, UserCheck, Shield, Building2, User } from "lucide-react";
import { useAuth } from "../App";
import WorkforceLogo from "../components/WorkforceLogo";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <WorkforceLogo size={56} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Sign in to access your Workforce Enterprise ERP
          </p>
        </div>

        {error && (
          <div className="badge badge-rose" style={{ display: 'block', padding: '10px 14px', marginBottom: 20, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="you@workforce.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
              Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-black" style={{ width: '100%', padding: '13px', marginTop: 8 }}>
            {loading ? "Signing in..." : <>Sign In to Dashboard <ArrowRight size={18} /></>}
          </button>
        </form>

        <div style={{ marginTop: 22, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}>
            Register New Account
          </Link>
        </div>

        {/* Quick Demo Login Shortcuts */}
        <div className="demo-shortcuts">
          <p><UserCheck size={14} style={{ display: 'inline', marginRight: 4 }} /> Instant Quick-Login (Demo Data)</p>
          <div className="demo-buttons">
            <button type="button" onClick={() => fillDemo("ceo@workforce.com")} className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>
              <Shield size={12} /> CEO Demo
            </button>
            <button type="button" onClick={() => fillDemo("manager@workforce.com")} className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>
              <Building2 size={12} /> Manager Demo
            </button>
            <button type="button" onClick={() => fillDemo("alex@workforce.com")} className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>
              <User size={12} /> Worker Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}