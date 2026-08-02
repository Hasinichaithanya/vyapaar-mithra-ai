import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Database, 
  Sparkles, 
  Store, 
  Activity, 
  Cake, 
  ShoppingBag, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Cpu,
  FileCode2,
  ArrowRight
} from 'lucide-react';

const SAMPLE_JSON_TEMPLATE = {
  business_profile: {
    business_name: "Vyapaar Super Mart",
    category: "Supermarket & Retail",
    years_in_operation: 5,
    employee_count: 4,
    monthly_revenue_range: "₹2,00,000 - ₹8,00,000",
    store_size_sqft: 800
  },
  locality_profile: {
    area_name: "HSR Layout",
    city: "Bengaluru",
    state: "Karnataka",
    population_estimate: 35000,
    nearby_colleges: 3,
    nearby_offices: 15
  },
  inventory_items: [
    {
      product_name: "Soft Drinks (750ml Cans)",
      category: "Beverages",
      quantity_detected: 60,
      min_required: 20,
      max_threshold: 120,
      estimated_unit_price: 40.0,
      turnover_speed: "Fast Moving"
    },
    {
      product_name: "Water Bottles 1L",
      category: "Beverages",
      quantity_detected: 10,
      min_required: 30,
      max_threshold: 150,
      estimated_unit_price: 20.0,
      turnover_speed: "Fast Moving"
    },
    {
      product_name: "Basmati Rice 5kg",
      category: "Grains",
      quantity_detected: 25,
      min_required: 10,
      max_threshold: 50,
      estimated_unit_price: 450.0,
      turnover_speed: "Fast Moving"
    },
    {
      product_name: "Sunflower Cooking Oil 1L",
      category: "Grocery",
      quantity_detected: 15,
      min_required: 25,
      max_threshold: 80,
      estimated_unit_price: 165.0,
      turnover_speed: "Fast Moving"
    }
  ],
  bills: [
    {
      supplier_name: "National FMCG Wholesalers",
      purchase_date: "2026-07-28",
      total_amount: 65000.0,
      items: [
        { product_name: "Beverages Wholesale Lot", category: "Beverages", quantity: 1, cost_price: 25000.0, total_price: 25000.0 },
        { product_name: "Grains & Groceries Lot", category: "Grocery", quantity: 1, cost_price: 40000.0, total_price: 40000.0 }
      ]
    }
  ]
};

export default function DataStudio({ setActiveTab }) {
  const [jsonText, setJsonText] = useState(JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [activePreset, setActivePreset] = useState(null);

  const presets = [
    {
      id: 'kirana',
      title: 'Kirana & General Store',
      icon: Store,
      color: '#06B6D4',
      badge: 'Most Popular',
      desc: 'Beverages, water bottles, chips, cooking oil, biscuits, personal care items.'
    },
    {
      id: 'pharmacy',
      title: 'Medical & Pharmacy',
      icon: Activity,
      color: '#10B981',
      badge: 'Healthcare',
      desc: 'Medicines, paracetamol strips, cough syrup, masks, sanitizers, first aid.'
    },
    {
      id: 'bakery',
      title: 'Bakery & Cafe',
      icon: Cake || Store,
      color: '#F59E0B',
      badge: 'Food & Snacks',
      desc: 'Fresh bread, chocolate cakes, patties, cookies, cold coffees.'
    },
    {
      id: 'supermarket',
      title: 'Supermarket & Retail',
      icon: ShoppingBag,
      color: '#6366F1',
      badge: 'Large Scale',
      desc: 'Grains, cooking oils, whole wheat flour, detergents, bulk snacks.'
    }
  ];

  // Quick Seed preset
  const handleSeedPreset = async (presetId) => {
    setLoading(true);
    setMessage(null);
    setError(null);
    setActivePreset(presetId);
    try {
      const res = await api.seedData({ store_type: presetId });
      setMessage(res.message);
    } catch (err) {
      setError(err.message || 'Failed to seed dataset.');
    } finally {
      setLoading(false);
    }
  };

  // Custom JSON Training Submit
  const handleTrainCustomData = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const parsedData = JSON.parse(jsonText);
      const res = await api.importCustomData(parsedData);
      setMessage(res.message);
    } catch (err) {
      setError(`Invalid JSON payload: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Export database JSON
  const handleExportData = async () => {
    setLoading(true);
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vyapar_mithra_dataset_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setMessage('Exported live database dataset as JSON file.');
    } catch (err) {
      setError('Failed to export dataset.');
    } finally {
      setLoading(false);
    }
  };

  // File Upload (.json)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target.result;
        JSON.parse(content); // validate JSON
        setJsonText(content);
        setMessage(`Loaded dataset file '${file.name}'. Click 'Train & Populate AI Backend' to apply.`);
      } catch (err) {
        setError('Uploaded file is not valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Reset database
  const handleResetData = async () => {
    if (!window.confirm("Are you sure you want to reset all backend database tables?")) return;
    setLoading(true);
    try {
      await api.resetData();
      setMessage('Database reset completed successfully.');
    } catch (err) {
      setError('Failed to reset database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="datastudio-page">
      <div className="section-header">
        <div>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Cpu className="text-cyan" size={28} /> AI Backend Data Studio & Trainer
          </h1>
          <p className="section-subtitle">
            Generate preset business datasets, upload custom training JSON, or edit raw records to train your AI backend dynamically.
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {message && (
        <div className="status-toast toast-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={20} />
          <div style={{ flex: 1 }}>
            <strong>Backend Training Complete!</strong>
            <p>{message}</p>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}
            onClick={() => setActiveTab('dashboard')}
          >
            View Dashboard <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="status-toast toast-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Training Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Preset Quick Seed Cards */}
      <h2 className="section-label">1. Quick Preset Business Data Generators</h2>
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {presets.map((p) => {
          const Icon = p.icon;
          const isCurrent = activePreset === p.id;
          return (
            <div key={p.id} className="glass-card preset-card">
              <div className="preset-card-header">
                <div className="preset-icon-box" style={{ background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40` }}>
                  <Icon size={22} />
                </div>
                <span className="preset-badge" style={{ background: `${p.color}15`, color: p.color, borderColor: `${p.color}30` }}>
                  {p.badge}
                </span>
              </div>

              <h3 className="preset-title">{p.title}</h3>
              <p className="preset-desc">{p.desc}</p>

              <button 
                className="btn btn-secondary btn-full"
                disabled={loading}
                onClick={() => handleSeedPreset(p.id)}
              >
                {loading && isCurrent ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} color={p.color} />}
                Generate & Train Dataset
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom JSON Data Editor Section */}
      <h2 className="section-label">2. Custom Training Data JSON Studio</h2>
      <div className="glass-card-section">
        <div className="section-card-header">
          <div>
            <h3 className="card-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCode2 size={20} className="text-cyan" /> Custom JSON Dataset Payload
            </h3>
            <p className="card-section-sub">
              Paste or edit custom JSON containing business profile, locality parameters, inventory items, and wholesale bills.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
              <Upload size={14} /> Upload JSON
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>

            <button className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }} onClick={handleExportData}>
              <Download size={14} /> Export DB
            </button>

            <button className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem', color: '#F87171' }} onClick={handleResetData}>
              <Trash2 size={14} /> Reset DB
            </button>
          </div>
        </div>

        <div className="json-editor-wrap" style={{ marginBottom: '1.25rem' }}>
          <textarea
            className="json-textarea"
            rows={16}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste your JSON dataset payload here..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setJsonText(JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2))}
          >
            Load Sample Template
          </button>

          <button 
            className="btn btn-primary"
            disabled={loading}
            onClick={handleTrainCustomData}
            style={{ padding: '0.75rem 1.75rem' }}
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Cpu size={18} />}
            Train & Populate AI Backend
          </button>
        </div>
      </div>
    </div>
  );
}
