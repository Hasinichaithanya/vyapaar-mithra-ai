import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, trendType = 'positive', accentColor = 'var(--primary)' }) {
  return (
    <div className="glasscard metric-card">
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        <div className="metric-icon-wrap" style={{ color: accentColor }}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
      <div>
        <div className="metric-value">{value}</div>
        {subtitle && (
          <div className={`metric-sub ${trendType}`}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
