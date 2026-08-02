import React from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Receipt, 
  Scan, 
  TrendingUp, 
  MapPin, 
  Bot, 
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  X,
  // Database
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  apiOnline, 
  isCollapsed, 
  setIsCollapsed,
  mobileOpen,
  setMobileOpen
}) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'onboarding', label: 'Business Profile', icon: Store },
    { id: 'bills', label: 'Bill Scanner', icon: Receipt },
    { id: 'inventory', label: 'Shelf Scanner', icon: Scan },
    { id: 'forecasting', label: 'AI Forecast', icon: TrendingUp },
    { id: 'market', label: 'Market Intel', icon: MapPin },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    // { id: 'datastudio', label: 'AI Data Studio', icon: Database },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Top Branding Section */}
        <div className="sidebar-header">
          <div className="logo-group">
            <div className="logo-icon">
              <Sparkles size={20} />
            </div>
            {!isCollapsed && (
              <div className="logo-text-wrapper">
                <div className="logo-text-title">Vyapaar Mithra</div>
                <div className="logo-subtitle">AI Business Intel</div>
              </div>
            )}
          </div>

          <button 
            className="sidebar-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Close button for mobile screen drawer */}
          <button 
            className="sidebar-mobile-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                title={isCollapsed ? tab.label : undefined}
              >
                <div className="nav-icon-wrap">
                  <Icon size={18} />
                </div>
                {!isCollapsed && <span className="nav-label">{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer / System Status */}
        <div className="sidebar-footer">
          <div 
            className={`status-badge ${apiOnline ? 'online' : 'connecting'} ${isCollapsed ? 'compact' : ''}`}
            title={isCollapsed ? (apiOnline ? 'AI Backend Online' : 'Connecting...') : undefined}
          >
            <span className="pulse-dot"></span>
            {!isCollapsed && (
              <span>{apiOnline ? 'AI Backend Online' : 'Connecting...'}</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
