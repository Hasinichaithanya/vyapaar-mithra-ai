import React from 'react';

export default function ScoreGauge({ label, score, maxScore = 100, color = 'var(--primary)', subtitle }) {
  const percent = Math.min(100, Math.max(0, (score / maxScore) * 100));

  return (
    <div className="glass-card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{label}</h4>
          {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color }}>
          {score}
          <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/{maxScore}</span>
        </span>
      </div>

      <div className="progress-bar-bg">
        <div 
          className="progress-bar-fill"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
