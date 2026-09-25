import React, { useEffect, useState } from "react";
import { CalendarDays, Plus, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useAuth } from "../App";
import api from "../api";

export default function LeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [type, setType] = useState("Annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const isExecutive = ["ceo", "manager"].includes(user?.role?.toLowerCase());

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const endpoint = isExecutive ? "/workforce/leaves" : "/workforce/leaves/my";
      const res = await api.get(endpoint);
      setLeaves(res.data.leaves || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await api.post("/workforce/leaves", { type, startDate, endDate, reason });
      setShowModal(false);
      setReason("");
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit leave request.");
    }
  };

  const handleReview = async (id, status) => {
    try {
      await api.patch(`/workforce/leaves/${id}/review`, { status, reviewNote: `Reviewed by ${user?.name}` });
      fetchLeaves();
    } catch (err) {
      alert("Failed to review leave application");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Leave Management & Applications</h2>
          <p>Submit time-off requests and track manager approvals.</p>
        </div>
        {!isExecutive && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={16} /> Apply for Leave
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive"><table className="custom-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Reason</th>
              <th>Status</th>
              {isExecutive && <th>Review Action</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>
                  No leave requests logged.
                </td>
              </tr>
            ) : (
              leaves.map((l) => (
                <tr key={l._id} className="table-row">
                  <td>
                    <strong style={{ color: '#f3f4f6' }}>{l.worker?.name || user?.name}</strong>
                    <span style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>{l.worker?.jobTitle || "Employee"}</span>
                  </td>
                  <td>
                    <span className="badge badge-indigo">{l.type}</span>
                  </td>
                  <td style={{ fontSize: 13, color: '#f3f4f6' }}>
                    {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: 13, color: '#9ca3af', maxWidth: 220 }}>{l.reason}</td>
                  <td>
                    <span className={`badge ${l.status === 'Approved' ? 'badge-emerald' : l.status === 'Rejected' ? 'badge-rose' : 'badge-amber'}`}>
                      {l.status}
                    </span>
                  </td>
                  {isExecutive && (
                    <td>
                      {l.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleReview(l._id, "Approved")} className="btn btn-success btn-sm">Approve</button>
                          <button onClick={() => handleReview(l._id, "Rejected")} className="btn btn-danger btn-sm">Reject</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>Decided</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#f3f4f6' }}>Apply for Leave</h3>
            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>LEAVE TYPE</label>
                <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Annual">Annual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Emergency">Emergency Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>START DATE</label>
                  <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>END DATE</label>
                  <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>REASON FOR LEAVE</label>
                <textarea className="input-field" rows="3" placeholder="Explain the reason for time-off..." value={reason} onChange={(e) => setReason(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
