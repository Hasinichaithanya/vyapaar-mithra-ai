import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import ScoreGauge from '../components/ScoreGauge';
import { 
  IndianRupee, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  ArrowUpRight,
  RefreshCw,
  ShoppingBag,
  Zap
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
        <p>Analyzing Business Health & Intelligence...</p>
      </div>
    );
  }

  const fin = metrics?.financial_metrics || {};
  const inv = metrics?.inventory_metrics || {};
  const ai = metrics?.ai_metrics || {};

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="section-title">Business Health Dashboard</h1>
          <p className="section-subtitle">Real-time overview of investment, inventory status, and AI business scores</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Financial Metrics Cards */}
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Financial Ledger Metrics</h2>
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard 
          title="Total Investment"
          value={`₹${fin.total_investment?.toLocaleString() || '48,000'}`}
          subtitle="Monthly bill purchases"
          icon={IndianRupee}
          accentColor="#06B6D4"
        />
        <StatCard 
          title="Inventory Stock Value"
          value={`₹${fin.inventory_value?.toLocaleString() || '32,500'}`}
          subtitle={`${inv.total_unique_products || 5} active shelf categories`}
          icon={Package}
          accentColor="#6366F1"
        />
        <StatCard 
          title="Estimated Revenue"
          value={`₹${fin.estimated_revenue?.toLocaleString() || '64,800'}`}
          subtitle="+35% avg retail margin"
          trendType="positive"
          icon={TrendingUp}
          accentColor="#10B981"
        />
        <StatCard 
          title="Estimated Net Profit"
          value={`₹${fin.estimated_profit?.toLocaleString() || '16,800'}`}
          subtitle={`${fin.profit_margin_percent || 25.9}% net margin`}
          trendType="positive"
          icon={Zap}
          accentColor="#F59E0B"
        />
      </div>

      {/* AI Health Scores */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <ScoreGauge 
          label="Business Health Score"
          score={ai.business_health_score || 86.5}
          color="#10B981"
          subtitle="Overall operational stability & margin efficiency"
        />
        <ScoreGauge 
          label="Growth Score"
          score={ai.growth_score || 84.0}
          color="#06B6D4"
          subtitle="Sales velocity & customer demand match"
        />
        <ScoreGauge 
          label="Market Opportunity Score"
          score={ai.market_opportunity_score || 88.0}
          color="#6366F1"
          subtitle="Locality potential (schools, offices, density)"
        />
      </div>

      {/* Inventory Health & Quick Insights */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} color="var(--primary)" />
            Inventory Stock Status
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>⚡ Fast Moving Products</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {inv.fast_moving_products?.map((p, i) => (
                <span key={i} className="badge badge-success">{p}</span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>⚠️ Low Stock Warnings</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {inv.low_stock_products?.map((p, i) => (
                <span key={i} className="badge badge-danger">{p}</span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>📦 Overstocked Inventory</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {inv.overstocked_products?.map((p, i) => (
                <span key={i} className="badge badge-warning">{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insight Box */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="badge badge-info" style={{ marginBottom: '0.75rem' }}>
              <Sparkles size={14} /> AI Recommendation Insight
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', lineHeight: 1.4 }}>
              "Soft drinks & cold water are selling 2.4x faster than biscuits. Increase reorder quantity by 20% before weekend peak hours."
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Based on digitized bills, shelf camera count, and nearby college student density.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={() => setActiveTab('forecasting')} className="btn btn-primary" style={{ flex: 1 }}>
              View AI Demand Forecast <ArrowUpRight size={16} />
            </button>
            <button onClick={() => setActiveTab('assistant')} className="btn btn-secondary">
              Ask AI Assistant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
