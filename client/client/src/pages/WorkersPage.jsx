import React, { useEffect, useState } from "react";
import { Users, UserPlus, Search } from "lucide-react";
import api from "../api";
import { SkeletonTable } from "../components/SkeletonLoader";

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "password123",
    phone: "",
    jobTitle: "",
    department: "",
    shift: "",
    salary: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wRes, dRes] = await Promise.all([
        api.get("/workforce/workers"),
        api.get("/workforce/departments")
      ]);
      setWorkers(wRes.data.workers || []);
      setDepartments(dRes.data.departments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    try {
      await api.post("/workforce/workers", form);
      setShowModal(false);
      setForm({ name: "", email: "", password: "password123", phone: "", jobTitle: "", department: "", shift: "", salary: "" });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create worker.");
    }
  };

  const toggleStatus = async (worker) => {
    try {
      const endpoint = worker.isActive ? `/workforce/workers/${worker._id}/deactivate` : `/workforce/workers/${worker._id}/activate`;
      await api.patch(endpoint);
      fetchData();
    } catch (err) {
      alert("Failed to change worker status");
    }
  };

  const filtered = workers.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.email.toLowerCase().includes(search.toLowerCase()) ||
    (w.jobTitle && w.jobTitle.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Team Workers Roster</h2>
          <p>Manage organization employees, job titles, department allocations, and account statuses.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-black">
          <UserPlus size={16} /> Add Worker
        </button>
      </div>

      <div style={{ marginBottom: 20, maxWidth: 400 }}>
        <input
          type="text"
          className="input-field"
          placeholder="Search by worker name, email, or job title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : (
        <div className="bento-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-responsive"><table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Job Title</th>
                <th>Department</th>
                <th>Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>
                    No workers found matching search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w._id} className="table-row">
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                          {w.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ color: "var(--text-primary)", display: "block" }}>{w.name}</strong>
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{w.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{w.jobTitle || "Employee"}</td>
                    <td>{w.department?.name || "Unassigned"}</td>
                    <td>${w.salary?.toLocaleString() || 0}/yr</td>
                    <td>
                      <span className="badge">
                        {w.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => toggleStatus(w)} className="btn btn-outline btn-sm">
                        {w.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table></div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: "var(--text-primary)" }}>Create New Worker Account</h3>
            <form onSubmit={handleCreateWorker} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>FULL NAME</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>EMAIL ADDRESS</label>
                <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>JOB TITLE</label>
                <input className="input-field" placeholder="e.g. Frontend Developer" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>DEPARTMENT</label>
                  <select className="input-field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    <option value="">Select Department...</option>
                    {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>ANNUAL SALARY ($)</label>
                  <input type="number" className="input-field" placeholder="75000" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-black">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
