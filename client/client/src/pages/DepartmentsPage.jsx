import React, { useEffect, useMemo, useState } from "react";
import { Building2, Plus, UserCheck, Users, X } from "lucide-react";
import api from "../api";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workers, setWorkers] = useState([]);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [assignmentError, setAssignmentError] = useState(false);

  useEffect(() => {
    loadDepartmentData();
  }, []);

  const loadDepartmentData = async () => {
    try {
      const [departmentResponse, workerResponse] = await Promise.all([
        api.get("/workforce/departments"),
        api.get("/workforce/workers")
      ]);
      setDepartments(departmentResponse.data.departments || []);
      setWorkers(workerResponse.data.workers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getDepartmentId = (worker) => worker.department?._id || worker.department || null;

  const assignedWorkers = (departmentId) =>
    workers.filter((worker) => String(getDepartmentId(worker)) === String(departmentId));

  const availableWorkers = useMemo(
    () => [...workers].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [workers]
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/workforce/departments", { name, description });
      setShowModal(false);
      setName("");
      setDescription("");
      loadDepartmentData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create department");
    }
  };

  const openAssignmentEditor = (department) => {
    setEditingDepartment(department);
    setSelectedWorkerIds(assignedWorkers(department._id).map((worker) => String(worker._id)));
    setAssignmentMessage("");
    setAssignmentError(false);
  };

  const toggleWorker = (workerId) => {
    setSelectedWorkerIds((current) =>
      current.includes(workerId)
        ? current.filter((id) => id !== workerId)
        : [...current, workerId]
    );
  };

  const saveAssignments = async (event) => {
    event.preventDefault();
    if (!editingDepartment || savingAssignments) return;

    const departmentId = String(editingDepartment._id);
    try {
      setSavingAssignments(true);
      await api.put(`/workforce/departments/${departmentId}/workers`, { workerIds: selectedWorkerIds });
      setAssignmentMessage("Worker assignments saved.");
      await loadDepartmentData();
      setEditingDepartment(null);
    } catch (err) {
      setAssignmentError(true);
      setAssignmentMessage(err.response?.data?.message || "Could not save all worker assignments. Please try again.");
    } finally {
      setSavingAssignments(false);
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

      <div className="dashboard-card-grid department-grid">
        {departments.map((d) => (
          <div key={d._id} className="glass-card">
            <div className="metric-icon icon-indigo" style={{ marginBottom: 16 }}>
              <Building2 size={24} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '8px 0 16px' }}>
              {d.description || "No department description set."}
            </p>
            <div className="department-assigned-team">
              <div className="department-team-heading">
                <span><Users size={15} /> Assigned workers</span>
                <span className="badge">{assignedWorkers(d._id).length}</span>
              </div>
              {assignedWorkers(d._id).length > 0 ? (
                <div className="department-worker-list">
                  {assignedWorkers(d._id).slice(0, 4).map((worker) => (
                    <span key={worker._id} className="department-worker-chip">{worker.name}</span>
                  ))}
                  {assignedWorkers(d._id).length > 4 && (
                    <span className="department-worker-chip">+{assignedWorkers(d._id).length - 4} more</span>
                  )}
                </div>
              ) : (
                <p className="department-no-workers">No workers assigned yet.</p>
              )}
              <button type="button" className="btn btn-outline btn-sm department-assign-button" onClick={() => openAssignmentEditor(d)}>
                <UserCheck size={15} /> Assign workers
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manager</span>
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

      {editingDepartment && (
        <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingDepartment(null); }}>
          <div className="modal-content department-assignment-modal" role="dialog" aria-modal="true" aria-labelledby="department-assignment-title">
            <div className="department-modal-header">
              <div>
                <h3 id="department-assignment-title">Assign workers</h3>
                <p>{editingDepartment.name}</p>
              </div>
              <button type="button" className="btn btn-outline btn-sm" aria-label="Close assignment dialog" onClick={() => setEditingDepartment(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveAssignments}>
              <p className="department-assignment-hint">Select every worker who should belong to this department. Selecting a worker moves them from their current department.</p>
              <div className="department-worker-picker">
                {availableWorkers.length ? availableWorkers.map((worker) => {
                  const workerId = String(worker._id);
                  const currentDepartment = worker.department?.name || "Unassigned";
                  return (
                    <label key={workerId} className="department-worker-option">
                      <input type="checkbox" checked={selectedWorkerIds.includes(workerId)} onChange={() => toggleWorker(workerId)} />
                      <span className="department-worker-option-info">
                        <strong>{worker.name}</strong>
                        <small>{worker.jobTitle || "Worker"} · {currentDepartment}</small>
                      </span>
                    </label>
                  );
                }) : <p className="department-no-workers">No workers found.</p>}
              </div>
              {assignmentMessage && <p className={`department-assignment-message ${assignmentError ? "error" : ""}`} role="status">{assignmentMessage}</p>}
              <div className="department-assignment-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditingDepartment(null)} disabled={savingAssignments}>Cancel</button>
                <button type="submit" className="btn btn-black" disabled={savingAssignments}>
                  {savingAssignments ? "Saving..." : `Save ${selectedWorkerIds.length} selected`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
