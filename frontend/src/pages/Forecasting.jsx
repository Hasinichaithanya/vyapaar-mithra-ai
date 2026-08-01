import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { TrendingUp, AlertTriangle, CheckCircle, RefreshCw, ShoppingCart, ShieldAlert, Sparkles } from 'lucide-react';
import ScoreGauge from '../components/ScoreGauge';

export default function Forecasting() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const data = await api.getForecast();
      setForecast(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
        <p>Calculating AI Demand Forecasts & Reorder Algorithms...</p>
      </div>
    );
  }

  const predictions = forecast?.predictions_data || [];
  const suggestions = forecast?.reorder_suggestions || [];
  const risks = forecast?.risk_alerts || [];

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="section-title">AI Demand Forecasting & Reorder Engine</h1>
          <p className="section-subtitle">Predict product demand for {forecast?.period || 'Next Week'} using sales velocity and locality intelligence</p>
        </div>
        <button onClick={loadForecast} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} /> Recalculate Forecast
        </button>
      </div>

      {/* Confidence Score Header */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <ScoreGauge 
          label="Forecast Confidence Index"
          score={forecast?.confidence_score || 89.2}
          color="var(--primary)"
          subtitle="Trained on purchase bills, shelf scans & locality demographics"
        />

        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
          <div className="badge badge-success" style={{ marginBottom: '0.5rem' }}>
            <Sparkles size={14} /> AI Recommendation Highlight
          </div>
          <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF', marginBottom: '0.4rem' }}>
            "Order 50 additional cool drink bottles & 45 water bottles before Friday."
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            High weekend temperature forecast combined with nearby college reopening.
          </p>
        </div>
      </div>

      {/* Product Demand Predictions List */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} color="var(--primary)" /> Predicted Product Demand Next Week
        </h2>

        <div className="grid-2" style={{ gap: '1.25rem' }}>
          {predictions.map((p, idx) => (
            <div 
              key={idx} 
              style={{ 
                padding: '1.25rem', 
                background: 'rgba(11, 15, 25, 0.6)', 
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>{p.product_name}</strong>
                <span className={`badge ${p.urgency === 'High' ? 'badge-danger' : (p.urgency === 'Medium' ? 'badge-warning' : 'badge-info')}`}>
                  {p.urgency} Urgency
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Stock</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{p.current_stock}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Predicted Demand</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{p.predicted_demand}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reorder Quantity</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: p.recommended_order > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                    +{p.recommended_order}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                💡 <strong>Reasoning:</strong> {p.reasoning}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Reorder Suggestions & Risk Alerts */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={18} color="var(--accent)" /> Reorder Action Suggestions
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {suggestions.map((s, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                <CheckCircle size={16} color="var(--accent)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} color="var(--danger)" /> Stock Risk Predictions
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {risks.map((r, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                <AlertTriangle size={16} color="var(--danger)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
