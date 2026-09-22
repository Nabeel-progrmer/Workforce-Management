import React, { useEffect, useState } from "react";
import { Building2, Plus, UserCheck } from "lucide-react";
import api from "../api";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/workforce/departments");
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/workforce/departments", { name, description });
      setShowModal(false);
      setName("");
      setDescription("");
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create department");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Organization Departments</h2>
          <p>Define operational units and department leadership allocations.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Department
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {departments.map((d) => (
          <div key={d._id} className="glass-card">
            <div className="metric-icon icon-indigo" style={{ marginBottom: 16 }}>
              <Building2 size={24} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#f3f4f6' }}>{d.name}</h3>
            <p style={{ color: '#9ca3af', fontSize: 14, margin: '8px 0 16px' }}>
              {d.description || "No department description set."}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>Manager</span>
              <span className="badge badge-emerald">
                <UserCheck size={13} />
                {d.manager?.name || "Unassigned"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#f3f4f6' }}>Create New Department</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>DEPARTMENT NAME</label>
                <input className="input-field" placeholder="e.g. Quality Assurance" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>DESCRIPTION</label>
                <textarea className="input-field" rows="3" placeholder="Scope & responsibilities..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
