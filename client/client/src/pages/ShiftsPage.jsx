import React, { useEffect, useState } from "react";
import { Clock, Plus, Calendar } from "lucide-react";
import api from "../api";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const res = await api.get("/workforce/shifts");
      setShifts(res.data.shifts || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/workforce/shifts", { name, startTime, endTime });
      setShowModal(false);
      setName("");
      fetchShifts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create shift pattern");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Work Shifts & Schedules</h2>
          <p>Configure working hours, shift timings, and weekly workdays.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Shift Pattern
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {shifts.map((s) => (
          <div key={s._id} className="glass-card">
            <div className="metric-icon icon-emerald" style={{ marginBottom: 16 }}>
              <Clock size={24} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#f3f4f6' }}>{s.name}</h3>
            <p style={{ color: '#34d399', fontSize: 16, fontWeight: 700, margin: '6px 0 12px' }}>
              {s.startTime} — {s.endTime}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {s.workDays?.map((d) => (
                <span key={d} className="badge badge-indigo" style={{ fontSize: 11 }}>{d.slice(0, 3)}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#f3f4f6' }}>Create New Shift Pattern</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>SHIFT NAME</label>
                <input className="input-field" placeholder="e.g. Night Shift" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>START TIME</label>
                  <input type="time" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>END TIME</label>
                  <input type="time" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
