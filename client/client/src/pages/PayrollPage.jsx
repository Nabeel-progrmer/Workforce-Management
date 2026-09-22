import React, { useEffect, useState } from "react";
import { CreditCard, Plus, FileText, CheckCircle, Printer } from "lucide-react";
import { useAuth } from "../App";
import api from "../api";

export default function PayrollPage() {
  const { user } = useAuth();
  const [payroll, setPayroll] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const [workerId, setWorkerId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [baseSalary, setBaseSalary] = useState(5000);
  const [bonus, setBonus] = useState(0);
  const [deductions, setDeductions] = useState(0);

  const isExecutive = ["ceo", "manager"].includes(user?.role?.toLowerCase());

  useEffect(() => {
    fetchPayroll();
    if (isExecutive) fetchWorkers();
  }, []);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const endpoint = isExecutive ? "/workforce/payroll" : "/workforce/payroll/my";
      const res = await api.get(endpoint);
      setPayroll(res.data.payroll || []);
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

  const handleCreatePayroll = async (e) => {
    e.preventDefault();
    try {
      await api.post("/workforce/payroll", {
        worker: workerId,
        month,
        year,
        baseSalary,
        bonus,
        deductions
      });
      setShowCreateModal(false);
      fetchPayroll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create payroll entry");
    }
  };

  const markPaid = async (id) => {
    try {
      await api.put(`/workforce/payroll/${id}`, { status: "Paid" });
      fetchPayroll();
    } catch (err) {
      alert("Failed to mark payroll as paid");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Payroll & Digital Payslips</h2>
          <p>Manage monthly compensation, bonuses, tax deductions, and view digital payslips.</p>
        </div>
        {isExecutive && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} /> Issue Monthly Payroll
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Period</th>
              {isExecutive && <th>Employee</th>}
              <th>Base Salary</th>
              <th>Bonus</th>
              <th>Deductions</th>
              <th>Net Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payroll.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>
                  No payroll records issued yet.
                </td>
              </tr>
            ) : (
              payroll.map((p) => (
                <tr key={p._id} className="table-row">
                  <td style={{ fontWeight: 600, color: '#f3f4f6' }}>
                    {p.month}/{p.year}
                  </td>
                  {isExecutive && (
                    <td>
                      <strong style={{ color: '#f3f4f6' }}>{p.worker?.name || "Worker"}</strong>
                      <span style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>{p.worker?.jobTitle}</span>
                    </td>
                  )}
                  <td>${p.baseSalary?.toLocaleString()}</td>
                  <td style={{ color: '#34d399' }}>+${p.bonus?.toLocaleString()}</td>
                  <td style={{ color: '#f87171' }}>-${p.deductions?.toLocaleString()}</td>
                  <td style={{ fontWeight: 800, color: '#818cf8', fontSize: 15 }}>
                    ${p.netSalary?.toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'Paid' ? 'badge-emerald' : 'badge-amber'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setSelectedPayslip(p)} className="btn btn-secondary btn-sm">
                        <FileText size={14} /> View Slip
                      </button>
                      {isExecutive && p.status !== 'Paid' && (
                        <button onClick={() => markPaid(p._id)} className="btn btn-success btn-sm">
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Payroll Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#f3f4f6' }}>Issue Worker Payroll</h3>
            <form onSubmit={handleCreatePayroll} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>TARGET WORKER</label>
                <select className="input-field" value={workerId} onChange={(e) => setWorkerId(e.target.value)} required>
                  <option value="">Select Employee...</option>
                  {workers.map(w => <option key={w._id} value={w._id}>{w.name} (${w.salary || 0}/yr)</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>MONTH (1-12)</label>
                  <input type="number" min="1" max="12" className="input-field" value={month} onChange={(e) => setMonth(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>YEAR</label>
                  <input type="number" className="input-field" value={year} onChange={(e) => setYear(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>BASE SALARY ($)</label>
                  <input type="number" className="input-field" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>BONUS ($)</label>
                  <input type="number" className="input-field" value={bonus} onChange={(e) => setBonus(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4, display: 'block' }}>DEDUCTIONS ($)</label>
                  <input type="number" className="input-field" value={deductions} onChange={(e) => setDeductions(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Payslip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Payslip Viewer Modal */}
      {selectedPayslip && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ background: '#0d1321', border: '1px solid #6366f1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: '0.1em' }}>WORKFORCE ENTERPRISE PAYSLIP</span>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f3f4f6' }}>Statement for {selectedPayslip.month}/{selectedPayslip.year}</h3>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="btn btn-secondary btn-sm">Close</button>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 20, borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, color: '#9ca3af' }}>
                <div>Employee: <strong style={{ color: '#f3f4f6' }}>{selectedPayslip.worker?.name || user?.name}</strong></div>
                <div>Status: <span className="badge badge-emerald">{selectedPayslip.status}</span></div>
                <div>Base Salary: <strong style={{ color: '#f3f4f6' }}>${selectedPayslip.baseSalary?.toLocaleString()}</strong></div>
                <div>Bonus Added: <strong style={{ color: '#34d399' }}>+${selectedPayslip.bonus?.toLocaleString()}</strong></div>
                <div>Tax Deductions: <strong style={{ color: '#f87171' }}>-${selectedPayslip.deductions?.toLocaleString()}</strong></div>
              </div>
              <div style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.15)', marginTop: 16, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#f3f4f6' }}>NET PAYABLE AMOUNT:</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#818cf8' }}>${selectedPayslip.netSalary?.toLocaleString()}</span>
              </div>
            </div>

            <button onClick={() => window.print()} className="btn btn-primary" style={{ width: '100%' }}>
              <Printer size={18} /> Print Official Payslip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
