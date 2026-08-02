// Independent API Client for Vyapaar Mithra AI Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function fetchJson(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export async function uploadFile(endpoint, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let detail = response.statusText;
    let errorType = null;
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') {
        detail = body.detail;
      } else if (body.detail?.message) {
        detail = body.detail.message;
        errorType = body.detail.error || null;
      } else if (body.message) {
        detail = body.message;
      }
    } catch {
      // keep statusText fallback
    }
    const err = new Error(detail);
    err.status = response.status;
    err.errorType = errorType;
    throw err;
  }
  return await response.json();
}

export const api = {
  // Business Onboarding & Profile
  getProfile: () => fetchJson('/business/profile'),
  saveProfile: (data) => fetchJson('/business/onboard', { method: 'POST', body: JSON.stringify(data) }),
  getMarketIntelligence: () => fetchJson('/business/market-intelligence'),

  // Bills & Investment Ledger
  getLedger: () => fetchJson('/bills/ledger'),
  scanBill: (file) => uploadFile('/bills/scan', file),

  // Inventory Vision Scanner
  getInventoryStatus: () => fetchJson('/inventory/status'),
  scanShelf: (file) => uploadFile('/inventory/scan', file),

  // Forecasting
  getForecast: () => fetchJson('/forecast/predict'),

  // AI Assistant Chat
  sendChatMessage: (message, language = 'en') => fetchJson('/assistant/chat', { method: 'POST', body: JSON.stringify({ message, language }) }),

  // Dashboard Metrics
  getDashboardMetrics: () => fetchJson('/dashboard/metrics'),

  // AI Data Studio & Training Seeder
  seedData: (data) => fetchJson('/seed/generate-data', { method: 'POST', body: JSON.stringify(data) }),
  importCustomData: (data) => fetchJson('/seed/custom-training-data', { method: 'POST', body: JSON.stringify(data) }),
  exportData: () => fetchJson('/seed/export-data'),
  resetData: () => fetchJson('/seed/reset', { method: 'DELETE' }),
};
