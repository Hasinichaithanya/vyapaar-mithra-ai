import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Upload, Receipt, FileText, CheckCircle, IndianRupee, RefreshCw, Clock, AlertTriangle, XCircle, Info } from 'lucide-react';

const RECENT_BILLS_LIMIT = 5;

function formatBillDate(bill) {
  if (bill.created_at) {
    return new Date(bill.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return bill.purchase_date || '—';
}

export default function BillScanner() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [latestScannedBill, setLatestScannedBill] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadErrorType, setUploadErrorType] = useState(null);

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
    setUploadError(null);
    setUploadErrorType(null);
    setLatestScannedBill(null);
    try {
      const result = await api.scanBill(file);
      setLatestScannedBill(result);
      await loadLedger();
    } catch (err) {
      console.error(err);
      setUploadError(err.message || 'Failed to process bill image via AI Vision');
      setUploadErrorType(
        err.errorType
        || (err.status === 409 ? 'duplicate_bill' : null)
        || (err.status === 503 ? 'ocr_failed' : 'non_business_document')
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const totalInvestment = bills.reduce((acc, b) => acc + (b.total_amount || 0), 0);
  const recentBills = bills.slice(0, RECENT_BILLS_LIMIT);

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

      {/* Recent Bills — shown at the top */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Clock size={20} color="var(--primary)" /> Recent Bills
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {bills.length} total · newest first
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={22} style={{ margin: '0 auto 0.5rem' }} />
            Loading recent bills...
          </div>
        ) : recentBills.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            No bills yet. Upload your first wholesale or retail purchase invoice below.
          </p>
        ) : (
          <div className="recent-bills-grid">
            {recentBills.map((bill, index) => (
              <div
                key={bill.id}
                className={`recent-bill-card${index === 0 ? ' recent-bill-card-latest' : ''}`}
              >
                {index === 0 && (
                  <span className="recent-bill-badge">Latest</span>
                )}
                <div className="recent-bill-supplier">{bill.supplier_name}</div>
                <div className="recent-bill-meta">
                  <span>{formatBillDate(bill)}</span>
                  <span>{bill.items?.length || 0} items</span>
                </div>
                <div className="recent-bill-amount">₹{bill.total_amount?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
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
              Business inventory purchase bills only. Hospital bills, school fees, and utility bills are rejected.
            </p>
          </label>

          {uploadError && (
            <div className={
              uploadErrorType === 'duplicate_bill'
                ? 'bill-upload-info'
                : uploadErrorType === 'ocr_failed'
                  ? 'bill-upload-warning'
                  : 'bill-upload-error'
            }>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                {uploadErrorType === 'duplicate_bill' ? <Info size={18} /> : uploadErrorType === 'ocr_failed' ? <AlertTriangle size={18} /> : <XCircle size={18} />}
                {uploadErrorType === 'duplicate_bill'
                  ? 'Bill Already in Ledger'
                  : uploadErrorType === 'ocr_failed'
                    ? 'Could Not Read Bill'
                    : 'Document Rejected'}
              </div>
              <p style={{ fontSize: '0.85rem', marginTop: '0.4rem', marginBottom: 0, lineHeight: 1.5 }}>
                {uploadError}
              </p>
              {uploadErrorType === 'duplicate_bill' && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                  Duplicate uploads are skipped to keep your investment ledger accurate.
                </p>
              )}
              {uploadErrorType !== 'ocr_failed' && uploadErrorType !== 'duplicate_bill' && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertTriangle size={14} /> Only wholesale/retail stock purchase invoices are stored in your ledger.
                </p>
              )}
            </div>
          )}

          {latestScannedBill && !uploadError && (
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

      {/* Full Bill History */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--secondary)" /> All Digitized Investment Receipts
        </h2>

        {bills.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No bills uploaded yet.</p>
        ) : (
          bills.map((bill) => (
            <div key={bill.id} style={{ marginBottom: '1.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(11, 15, 25, 0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '1.05rem' }}>{bill.supplier_name}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>Date: {formatBillDate(bill)}</span>
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
