import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import BillScanner from './pages/BillScanner';
import ShelfScanner from './pages/ShelfScanner';
import Forecasting from './pages/Forecasting';
import MarketIntel from './pages/MarketIntel';
import Assistant from './pages/Assistant';
// import DataStudio from './pages/DataStudio';
import { api } from './api/client';
import { Menu, Sparkles } from 'lucide-react';
import './styles/index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiOnline, setApiOnline] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <div className={`app-container sidebar-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        apiOnline={apiOnline} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="main-wrapper">
        {/* Top Trigger Bar (Visible when sidebar is collapsed or on mobile) */}
        <header className="mobile-top-bar">
          <button 
            className="top-bar-toggle-btn"
            onClick={() => {
              if (window.innerWidth <= 768) {
                setMobileOpen(!mobileOpen);
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            aria-label="Toggle Menu"
          >
            <Menu size={22} />
          </button>
          <div className="top-bar-brand">
            <Sparkles size={18} className="text-cyan" />
            <span className="top-bar-title">Vyapaar Mithra AI</span>
          </div>
        </header>

        <main className="main-content">
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'onboarding' && <Onboarding />}
          {activeTab === 'bills' && <BillScanner />}
          {activeTab === 'inventory' && <ShelfScanner />}
          {activeTab === 'forecasting' && <Forecasting />}
          {activeTab === 'market' && <MarketIntel />}
          {activeTab === 'assistant' && <Assistant />}
          {/* {activeTab === 'datastudio' && <DataStudio setActiveTab={setActiveTab} />} */}
        </main>
      </div>
    </div>
  );
}
