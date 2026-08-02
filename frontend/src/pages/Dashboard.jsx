import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { 
  Wallet, 
  Package, 
  TrendingUp, 
  BarChart3, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Target, 
  Settings,
  ChevronRight,
  Boxes
} from 'lucide-react';

// Item Thumbnail SVG Icons matching reference mockup
const ProductIcon = ({ type }) => {
  switch (type) {
    case 'soft_drinks':
      return (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          🥤
        </div>
      );
    case 'water':
      return (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          💧
        </div>
      );
    case 'chips':
      return (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          🍿
        </div>
      );
    case 'oil':
      return (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(234, 179, 8, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          🍾
        </div>
      );
    case 'sprite':
      return (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          🟢
        </div>
      );
    case 'cola':
      return (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(185, 28, 28, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          🥤
        </div>
      );
    case 'glucond':
      return (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          📦
        </div>
      );
    case 'parleg':
      return (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(217, 119, 6, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          🍪
        </div>
      );
    case 'colgate':
      return (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          🪥
        </div>
      );
    case 'dettol':
      return (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          🧴
        </div>
      );
    default:
      return (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          📦
        </div>
      );
  }
};

export default function Dashboard({ setActiveTab }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

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
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
        <p>Loading Business Health Dashboard...</p>
      </div>
    );
  }

  const fin = metrics?.financial_metrics || {};
  const inv = metrics?.inventory_metrics || {};
  const ai = metrics?.ai_metrics || {};

  // Stock status table dataset
  const stockTableItems = [
    { name: 'Soft Drinks (750ml Cans)', type: 'soft_drinks', status: 'Well Stocked', level: 'High', category: 'fast' },
    { name: 'Water Bottles 1L', type: 'water', status: 'Well Stocked', level: 'High', category: 'fast' },
    { name: 'Chips Packs (Large)', type: 'chips', status: 'Well Stocked', level: 'High', category: 'fast' },
    { name: 'Cooking Oil 1L', type: 'oil', status: 'Well Stocked', level: 'High', category: 'fast' },
    { name: 'Sprite Bottle (Various)', type: 'sprite', status: 'Well Stocked', level: 'High', category: 'fast' },
    { name: 'Cola Bottle (Various)', type: 'cola', status: 'Well Stocked', level: 'High', category: 'fast' },
    { name: 'Glucon-D (500g)', type: 'glucond', status: 'Well Stocked', level: 'High', category: 'fast' },
    { name: 'Parle-G (Small)', type: 'parleg', status: 'Well Stocked', level: 'High', category: 'fast' },
  ];

  const filteredItems = stockTableItems.filter(item => {
    if (categoryFilter === 'fast') return item.category === 'fast';
    if (categoryFilter === 'low') return item.status === 'Low Stock';
    return true;
  });

  // Low stock warning grid items
  const lowStockItems = [
    { name: 'Soft Drinks (750ml Cans)', type: 'soft_drinks' },
    { name: 'Water Bottles 1L', type: 'water' },
    { name: 'Chips Packs (Large)', type: 'chips' },
    { name: 'Glucon-D (Small Pack)', type: 'glucond' },
    { name: 'Colgate Toothpaste', type: 'colgate' },
    { name: 'Dettol Handwash', type: 'dettol' },
  ];

  // Overstocked items
  const overstockedItems = [
    'Biscuit Packs (Assorted)',
    'Biscuit Packs (Assorted)',
    'Biscuit Packs (Assorted)',
    'Biscuit Packs (Assorted)',
    'Biscuit Packs (Assorted)',
    'Biscuit Packs (Assorted)',
    'Biscuit Packs (Assorted)',
    'Biscuit Packs (Assorted)',
    'Biscuit Packs (Assorted)',
    'Biscuit Packs (Assorted)',
  ];

  return (
    <div className="dashboard-container">
      {/* Top Title Bar */}
      <div className="dashboard-header">
        <div>
          <h1 className="section-title">Business Health Dashboard</h1>
          <p className="section-subtitle">Real-time overview of investment, inventory status, and AI business insights.</p>
        </div>
        <button onClick={loadData} className="btn-refresh">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Key Metrics Row */}
      <div className="metrics-section">
        <h2 className="section-label">Key Metrics</h2>
        <div className="grid-4">
          <div className="metric-card-box">
            <div className="metric-card-header">
              <div className="icon-box icon-blue">
                <Wallet size={20} />
              </div>
              <span className="metric-card-title">Total Investment</span>
            </div>
            <div className="metric-card-body">
              <div className="metric-card-value">₹{fin.total_investment?.toLocaleString() || '96,000'}</div>
              <div className="metric-card-sub text-green">Monthly till purchases</div>
            </div>
          </div>

          <div className="metric-card-box">
            <div className="metric-card-header">
              <div className="icon-box icon-green">
                <Package size={20} />
              </div>
              <span className="metric-card-title">Inventory Stock Value</span>
            </div>
            <div className="metric-card-body">
              <div className="metric-card-value">₹{fin.inventory_value?.toLocaleString() || '94,050'}</div>
              <div className="metric-card-sub text-green">112 active shelf categories</div>
            </div>
          </div>

          <div className="metric-card-box">
            <div className="metric-card-header">
              <div className="icon-box icon-purple">
                <TrendingUp size={20} />
              </div>
              <span className="metric-card-title">Estimated Revenue</span>
            </div>
            <div className="metric-card-body">
              <div className="metric-card-value">₹{fin.estimated_revenue?.toLocaleString() || '129,600'}</div>
              <div className="metric-card-sub text-green">+35% vs last month</div>
            </div>
          </div>

          <div className="metric-card-box">
            <div className="metric-card-header">
              <div className="icon-box icon-amber">
                <BarChart3 size={20} />
              </div>
              <span className="metric-card-title">Estimated Net Profit</span>
            </div>
            <div className="metric-card-body">
              <div className="metric-card-value">₹{fin.estimated_profit?.toLocaleString() || '33,600'}</div>
              <div className="metric-card-sub text-green">25.9% net margin</div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Health Score Enclosed Box */}
      <div className="glass-card-section" style={{ marginBottom: '1.75rem' }}>
        <div className="section-card-header">
          <h3 className="card-section-title">Business Health Score</h3>
          <button className="link-btn" onClick={() => setActiveTab('forecasting')}>
            View Details <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid-3">
          <div className="score-item-card">
            <div className="score-header">
              <div className="score-icon-wrap bg-green-subtle">
                <TrendingUp size={18} className="text-green-bright" />
              </div>
              <div>
                <h4 className="score-title">Growth Score</h4>
                <p className="score-sub">Sales velocity & customer demand match</p>
              </div>
            </div>
            <div className="score-value-row">
              <span className="score-number">{ai.growth_score || 84}</span>
              <span className="score-max">/100</span>
            </div>
            <div className="score-bar-bg">
              <div className="score-bar-fill bar-green" style={{ width: `${ai.growth_score || 84}%` }} />
            </div>
          </div>

          <div className="score-item-card">
            <div className="score-header">
              <div className="score-icon-wrap bg-purple-subtle">
                <Target size={18} className="text-purple-bright" />
              </div>
              <div>
                <h4 className="score-title">Market Opportunity Score</h4>
                <p className="score-sub">Locality potential (schools, offices, density)</p>
              </div>
            </div>
            <div className="score-value-row">
              <span className="score-number">{ai.market_opportunity_score || 88}</span>
              <span className="score-max">/100</span>
            </div>
            <div className="score-bar-bg">
              <div className="score-bar-fill bar-purple" style={{ width: `${ai.market_opportunity_score || 88}%` }} />
            </div>
          </div>

          <div className="score-item-card">
            <div className="score-header">
              <div className="score-icon-wrap bg-blue-subtle">
                <Settings size={18} className="text-blue-bright" />
              </div>
              <div>
                <h4 className="score-title">Operational Score</h4>
                <p className="score-sub">Overall operational stability & margin efficiency</p>
              </div>
            </div>
            <div className="score-value-row">
              <span className="score-number">{ai.business_health_score || 84}</span>
              <span className="score-max">/100</span>
            </div>
            <div className="score-bar-bg">
              <div className="score-bar-fill bar-blue" style={{ width: `${ai.business_health_score || 84}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Inventory Stock Status & AI Recommendation Insight */}
      <div className="split-grid-2" style={{ marginBottom: '1.75rem' }}>
        {/* Left Column: Inventory Stock Status */}
        <div className="glass-card-section">
          <div className="inventory-header-row">
            <h3 className="card-section-title">Inventory Stock Status</h3>
            <div className="filter-chips-group">
              <button 
                className={`filter-chip ${categoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('all')}
              >
                All Categories
              </button>
              <button 
                className={`filter-chip ${categoryFilter === 'fast' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('fast')}
              >
                Fast Moving
              </button>
              <button 
                className={`filter-chip ${categoryFilter === 'low' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('low')}
              >
                Low Stock
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="stock-data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Stock Level</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="item-category-cell">
                        <ProductIcon type={item.type} />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="status-pill status-pill-success">
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="stock-level-cell">
                        <div className="level-bar-bg">
                          <div className="level-bar-fill" style={{ width: '85%' }} />
                        </div>
                        <span className="level-text">High</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button 
            className="btn-view-all"
            onClick={() => setActiveTab('inventory')}
          >
            View All Inventory (112 Categories) <ArrowRight size={14} />
          </button>
        </div>

        {/* Right Column: AI Recommendation Insight */}
        <div className="glass-card-section ai-recommendation-card">
          <div className="ai-rec-header">
            <Sparkles size={18} className="text-cyan" />
            <span className="ai-rec-title">AI Recommendation Insight</span>
          </div>

          <div className="ai-quote-box">
            <div className="quote-mark">“</div>
            <p className="quote-text">
              Soft drinks & cold water are selling <strong className="text-highlight">2.4x</strong> faster than biscuits. Increase reorder quantity by <strong className="text-highlight">20%</strong> before weekend peak hours.
            </p>
            <p className="quote-source">
              Based on digitized bills, shelf camera count, and nearby college student density.
            </p>

            {/* Glowing AI Node & Chart Graphic Box */}
            <div className="ai-chart-visual">
              <div className="visual-lines">
                <svg width="100%" height="100" viewBox="0 0 300 100" fill="none">
                  <path d="M 10 70 Q 50 30 90 60 T 170 40 T 250 20" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="4 2" />
                  <path d="M 10 80 Q 70 50 130 70 T 210 30 T 290 15" stroke="#06B6D4" strokeWidth="3" />
                  <circle cx="90" cy="60" r="4" fill="#3B82F6" />
                  <circle cx="170" cy="40" r="4" fill="#06B6D4" />
                  <circle cx="250" cy="20" r="4" fill="#6366F1" />
                </svg>
              </div>

              {/* Bar Chart pillars */}
              <div className="visual-bars">
                <div className="v-bar" style={{ height: '40%' }}></div>
                <div className="v-bar" style={{ height: '65%' }}></div>
                <div className="v-bar" style={{ height: '50%' }}></div>
                <div className="v-bar" style={{ height: '80%' }}></div>
                <div className="v-bar" style={{ height: '95%' }}></div>
              </div>

              <div className="ai-node-badge">
                <span>AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Warnings */}
      <div className="glass-card-section" style={{ marginBottom: '1.75rem' }}>
        <div className="section-card-header">
          <div className="title-with-badge">
            <div className="warning-icon-box">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="card-section-title">Low Stock Warnings</h3>
              <p className="card-section-sub">These items are running low. Reorder soon to avoid stockouts.</p>
            </div>
          </div>
          <button className="link-btn link-danger" onClick={() => setActiveTab('inventory')}>
            View All Low Stock <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid-6">
          {lowStockItems.map((item, i) => (
            <div key={i} className="low-stock-card">
              <div className="low-stock-icon-wrap">
                <ProductIcon type={item.type} />
              </div>
              <div className="low-stock-info">
                <span className="low-stock-name">{item.name}</span>
                <span className="low-stock-badge">
                  <span className="dot-red" /> Low Stock
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overstocked Inventory */}
      <div className="glass-card-section">
        <div className="section-card-header">
          <div className="title-with-badge">
            <div className="overstock-icon-box">
              <Boxes size={18} />
            </div>
            <div>
              <h3 className="card-section-title">Overstocked Inventory</h3>
              <p className="card-section-sub">High inventory detected. Consider promotions or reduced reordering.</p>
            </div>
          </div>
          <button className="link-btn link-success" onClick={() => setActiveTab('inventory')}>
            View All Overstocked <ArrowRight size={14} />
          </button>
        </div>

        <div className="overstock-grid">
          {overstockedItems.map((item, i) => (
            <div key={i} className="overstock-pill-chip">
              <span>{item}</span>
              <ChevronRight size={14} className="chip-arrow" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
