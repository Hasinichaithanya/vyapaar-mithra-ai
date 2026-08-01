import React, { useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Receipt, 
  Scan, 
  TrendingUp, 
  MapPin, 
  Bot, 
  Sparkles 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiOnline }) {
  const navRef = useRef(null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'onboarding', label: 'Business Profile', icon: Store },
    { id: 'bills', label: 'Bill Scanner', icon: Receipt },
    { id: 'inventory', label: 'Shelf Scanner', icon: Scan },
    { id: 'forecasting', label: 'AI Forecast', icon: TrendingUp },
    { id: 'market', label: 'Market Intel', icon: MapPin },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
  ];

  useEffect(() => {
    if (navRef.current) {
      const activeBtn = navRef.current.querySelector('.nav-tab-btn.active');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  return (
    <header className="header-nav">
      <div className="nav-wrapper">
        <div className="logo-group">
          <div className="logo-icon">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="logo-text-title">Vyapaar Mithra AI</div>
            <div className="logo-subtitle">AI Business Intelligence</div>
          </div>
        </div>

        <nav className="nav-tabs" ref={navRef}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`status-badge ${apiOnline ? 'online' : 'connecting'}`}>
          <span className="pulse-dot"></span>
          <span>{apiOnline ? 'AI Backend Online' : 'Connecting...'}</span>
        </div>
      </div>
    </header>
  );
}

