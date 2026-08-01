import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Upload, Receipt, FileText, CheckCircle, IndianRupee, Sparkles, RefreshCw } from 'lucide-react';

export default function BillScanner() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [latestScannedBill, setLatestScannedBill] = useState(null);

  const loadLedger = async () => {
    setLoading(true);
    try {
      const data = await api.getLedger();
      setBills(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await api.scanBill(file);
      setLatestScannedBill(result);
      await loadLedger();
    } catch (err) {
      console.error(err);
      alert('Failed to process bill image via AI Vision');
    } finally {
      setUploading(false);
    }
  };

  const totalInvestment = bills.reduce((acc, b) => acc + (b.total_amount || 0), 0);

  // Group items by category
  const categoryTotals = {};
  bills.forEach(b => {
    b.items?.forEach(i => {
      categoryTotals[i.category] = (categoryTotals[i.category] || 0) + (i.total_price || 0);
    });
  });

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Smart Bill Scanner</h1>
        <p className="section-subtitle">Digitize purchase invoices automatically using Gemini Vision AI OCR</p>
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Upload Zone */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} color="var(--primary)" /> Scan Purchase Bill
          </h2>

          <label className="upload-zone" style={{ display: 'block' }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
              disabled={uploading}
            />
            <div className="upload-icon">
              {uploading ? <RefreshCw className="animate-spin" size={28} /> : <Receipt size={28} />}
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {uploading ? 'Extracting OCR Fields with Gemini AI...' : 'Click or Drop Bill Receipt Image'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Supports JPG, PNG, WEBP invoices. Automatically extracts Supplier, Date, Items & Cost Prices.
            </p>
          </label>

          {latestScannedBill && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}>
                <CheckCircle size={18} /> Successfully Digitized Bill!
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.3rem' }}>
                Supplier: <strong>{latestScannedBill.supplier_name}</strong> | Total: <strong>₹{latestScannedBill.total_amount?.toLocaleString()}</strong> ({latestScannedBill.items?.length || 0} line items)
              </p>
            </div>
          )}
        </div>

        {/* Investment Ledger Summary */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IndianRupee size={20} color="var(--accent)" /> Investment Ledger Summary
          </h2>

          <div style={{ padding: '1.25rem', background: 'rgba(6, 182, 212, 0.08)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Investment Recorded
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#FFFFFF', marginTop: '0.2rem' }}>
              ₹{totalInvestment.toLocaleString()}
            </div>
          </div>

          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Purchased Categories:</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {Object.entries(categoryTotals).map(([cat, amt]) => (
              <div key={cat} className="badge badge-info" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}>
                {cat}: <strong>₹{amt.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bill History Table */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--secondary)" /> Digitized Investment Receipts & Items
        </h2>

        {bills.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No bills uploaded yet.</p>
        ) : (
          bills.map((bill) => (
            <div key={bill.id} style={{ marginBottom: '1.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(11, 15, 25, 0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '1.05rem' }}>{bill.supplier_name}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>Date: {bill.purchase_date}</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Total: ₹{bill.total_amount?.toLocaleString()}
                </div>
              </div>

              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Cost Price (Unit)</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items?.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                        <td><span className="badge badge-info">{item.category}</span></td>
                        <td>{item.quantity} units</td>
                        <td>₹{item.cost_price}</td>
                        <td style={{ fontWeight: 700, color: '#FFFFFF' }}>₹{item.total_price?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
