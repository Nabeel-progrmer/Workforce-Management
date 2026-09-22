import React, { useEffect, useState } from "react";
import { CheckSquare, Plus, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { useAuth } from "../App";
import api from "../api";

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("Medium");

  const isExecutive = ["ceo", "manager"].includes(user?.role?.toLowerCase());

  useEffect(() => {
    fetchTasks();
    if (isExecutive) fetchWorkers();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const endpoint = isExecutive ? "/workforce/tasks" : "/workforce/tasks/my";
      const res = await api.get(endpoint);
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get("/workforce/workers");
      setWorkers(res.data.workers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post("/workforce/tasks", { title, description, assignedTo, priority });
      setShowModal(false);
      setTitle("");
      setDescription("");
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign task");
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/workforce/tasks/${taskId}/status`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert("Failed to update task status");
    }
  };

  const columns = ["Todo", "In Progress", "Completed"];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Workforce Tasks & Kanban Board</h2>
          <p>Assign deliverables, set priorities, and track progress across stages.</p>
        </div>
        {isExecutive && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={16} /> Assign New Task
          </button>
        )}
      </div>

      <div className="kanban-board">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col);
          return (
            <div key={col} className="kanban-column">
              <div className="kanban-header">
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f3f4f6' }}>{col}</h3>
                <span className="badge badge-indigo">{colTasks.length}</span>
              </div>

              {colTasks.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                  No tasks in {col} stage.
                </div>
              ) : (
                colTasks.map((t) => (
                  <div key={t._id} className="kanban-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className={`badge ${t.priority === 'Urgent' ? 'badge-rose' : t.priority === 'High' ? 'badge-amber' : 'badge-indigo'}`}>
                        {t.priority} Priority
                      </span>
                    </div>

                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#f3f4f6', marginTop: 4 }}>{t.title}</h4>
                    <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.4 }}>{t.description || "No description."}</p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        To: {t.assignedTo?.name || "Worker"}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {col !== "Todo" && (
                          <button onClick={() => updateStatus(t._id, col === "Completed" ? "In Progress" : "Todo")} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: 11 }}>
                            ← Back
                          </button>
                        )}
                        {col !== "Completed" && (
                          <button onClick={() => updateStatus(t._id, col === "Todo" ? "In Progress" : "Completed")} className="btn btn-primary btn-sm" style={{ padding: '2px 8px', fontSize: 11 }}>
                            Next →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#f3f4f6' }}>Assign New Task</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>TASK TITLE</label>
                <input className="input-field" placeholder="e.g. Audit security logs" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>DESCRIPTION</label>
                <textarea className="input-field" rows="3" placeholder="Provide task requirements..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>ASSIGN TO WORKER</label>
                  <select className="input-field" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required>
                    <option value="">Select Worker...</option>
                    {workers.map(w => <option key={w._id} value={w._id}>{w.name} ({w.jobTitle})</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>PRIORITY</label>
                  <select className="input-field" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
