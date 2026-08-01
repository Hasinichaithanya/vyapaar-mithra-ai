import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Store, MapPin, Users, Save, CheckCircle, Sparkles } from 'lucide-react';

export default function Onboarding() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    business_name: 'Mithra Super Mart',
    category: 'Kirana Store',
    years_in_operation: 3,
    employee_count: 2,
    monthly_revenue_range: '₹1,50,000 - ₹3,00,000',
    store_size_sqft: 650,
    locality: {
      area_name: 'Koramangala 4th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      population_estimate: 18500,
      residential_density: 'High',
      nearby_schools: 3,
      nearby_colleges: 2,
      nearby_offices: 8,
      nearby_hospitals: 1,
      nearby_tourist_spots: 0,
      competitor_count: 2,
      target_customer_segment: 'Students, tech professionals, local families',
      peak_sales_hours: '5 PM - 10 PM',
      most_demanded_products: 'Soft Drinks, Water Bottles, Chips, Biscuits, Dairy'
    }
  });

  useEffect(() => {
    api.getProfile().then((data) => {
      if (data && data.business_name) {
        setForm({
          business_name: data.business_name || '',
          category: data.category || 'Kirana Store',
          years_in_operation: data.years_in_operation || 1,
          employee_count: data.employee_count || 1,
          monthly_revenue_range: data.monthly_revenue_range || '₹1,00,000 - ₹3,00,000',
          store_size_sqft: data.store_size_sqft || 500,
          locality: data.locality || form.locality
        });
      }
    }).catch(err => console.error(err));
  }, []);

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleLocalityChange = (field, val) => {
    setForm(prev => ({
      ...prev,
      locality: { ...prev.locality, [field]: val }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await api.saveProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Business & Locality Intelligence Profile</h1>
        <p className="section-subtitle">Collect contextual business and neighborhood parameters for hyper-targeted AI recommendations</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid-2" style={{ marginBottom: '2rem' }}>
          {/* Business Info */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Store size={20} color="var(--primary)" /> Business Details
            </h2>

            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={form.business_name} 
                onChange={(e) => handleChange('business_name', e.target.value)}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-select"
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option value="Kirana Store">Kirana Store / Provision</option>
                  <option value="Medical Shop">Medical Shop / Pharmacy</option>
                  <option value="Bakery">Bakery & Confectionery</option>
                  <option value="Hardware Store">Hardware Store</option>
                  <option value="Stationery Shop">Stationery Shop</option>
                  <option value="Local Retail Business">Local Retail Business</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Years of Operation</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.years_in_operation} 
                  onChange={(e) => handleChange('years_in_operation', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Employee Count</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.employee_count} 
                  onChange={(e) => handleChange('employee_count', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Store Size (sq. ft.)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.store_size_sqft} 
                  onChange={(e) => handleChange('store_size_sqft', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Revenue Range</label>
              <select 
                className="form-select"
                value={form.monthly_revenue_range}
                onChange={(e) => handleChange('monthly_revenue_range', e.target.value)}
              >
                <option value="Below ₹50,000">Below ₹50,000</option>
                <option value="₹50,000 - ₹1,50,000">₹50,000 - ₹1,50,000</option>
                <option value="₹1,50,000 - ₹3,00,000">₹1,50,000 - ₹3,00,000</option>
                <option value="Above ₹3,00,000">Above ₹3,00,000</option>
              </select>
            </div>
          </div>

          {/* Locality Info */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="var(--secondary)" /> Locality & Market Surroundings
            </h2>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Area / Locality Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={form.locality.area_name} 
                  onChange={(e) => handleLocalityChange('area_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={form.locality.city} 
                  onChange={(e) => handleLocalityChange('city', e.target.value)}
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Nearby Schools</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.locality.nearby_schools} 
                  onChange={(e) => handleLocalityChange('nearby_schools', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Colleges</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.locality.nearby_colleges} 
                  onChange={(e) => handleLocalityChange('nearby_colleges', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Offices</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.locality.nearby_offices} 
                  onChange={(e) => handleLocalityChange('nearby_offices', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Competitors Nearby</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.locality.competitor_count} 
                  onChange={(e) => handleLocalityChange('competitor_count', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Peak Sales Hours</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={form.locality.peak_sales_hours} 
                  onChange={(e) => handleLocalityChange('peak_sales_hours', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Customer Segment</label>
              <input 
                type="text" 
                className="form-input" 
                value={form.locality.target_customer_segment} 
                onChange={(e) => handleLocalityChange('target_customer_segment', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {saved ? (
            <div className="badge badge-success" style={{ fontSize: '0.95rem', padding: '0.6rem 1.25rem' }}>
              <CheckCircle size={18} /> Business Profile saved! AI engine updated.
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <Sparkles size={14} style={{ display: 'inline', marginRight: '0.3rem', color: 'var(--primary)' }} />
              Updating profile automatically tunes AI Demand & Reorder engines.
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={18} /> {loading ? 'Saving Profile...' : 'Save & Calibrate AI Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
