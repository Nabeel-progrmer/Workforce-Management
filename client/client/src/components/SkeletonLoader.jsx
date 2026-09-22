import React from "react";

export function SkeletonMetric() {
  return (
    <div className="metric-card skeleton-pulse">
      <div className="metric-icon" style={{ background: 'var(--bg-surface)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '45%', height: 14, background: 'var(--bg-surface)', borderRadius: 6, marginBottom: 8 }} />
        <div style={{ width: '70%', height: 28, background: 'var(--bg-surface)', borderRadius: 8 }} />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bento-card skeleton-pulse">
      <div style={{ width: '30%', height: 16, background: 'var(--bg-surface)', borderRadius: 6, marginBottom: 16 }} />
      <div style={{ width: '90%', height: 22, background: 'var(--bg-surface)', borderRadius: 8, marginBottom: 12 }} />
      <div style={{ width: '60%', height: 14, background: 'var(--bg-surface)', borderRadius: 6 }} />
    </div>
  );
}

export function SkeletonTable({ rows = 4 }) {
  return (
    <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="custom-table">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="table-row skeleton-pulse">
              <td><div style={{ width: 140, height: 16, background: 'var(--bg-surface)', borderRadius: 6 }} /></td>
              <td><div style={{ width: 100, height: 16, background: 'var(--bg-surface)', borderRadius: 6 }} /></td>
              <td><div style={{ width: 80, height: 16, background: 'var(--bg-surface)', borderRadius: 6 }} /></td>
              <td><div style={{ width: 60, height: 22, background: 'var(--bg-surface)', borderRadius: 999 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
