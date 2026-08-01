import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import BillScanner from './pages/BillScanner';
import ShelfScanner from './pages/ShelfScanner';
import Forecasting from './pages/Forecasting';
import MarketIntel from './pages/MarketIntel';
import Assistant from './pages/Assistant';
import { api } from './api/client';
import './styles/index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    // Check backend health status
    api.getProfile()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    const interval = setInterval(() => {
      api.getProfile()
        .then(() => setApiOnline(true))
        .catch(() => setApiOnline(false));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        apiOnline={apiOnline} 
      />

      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'onboarding' && <Onboarding />}
        {activeTab === 'bills' && <BillScanner />}
        {activeTab === 'inventory' && <ShelfScanner />}
        {activeTab === 'forecasting' && <Forecasting />}
        {activeTab === 'market' && <MarketIntel />}
        {activeTab === 'assistant' && <Assistant />}
      </main>
    </div>
  );
}
