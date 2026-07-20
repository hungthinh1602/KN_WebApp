import React from 'react';
import { 
  DashboardIcon, 
  SignalsIcon, 
  BotIcon, 
  HistoryIcon, 
  PlusIcon 
} from './Icons';

export const Sidebar = ({ activeTab, setActiveTab, onDeployBotClick, isOpen, setIsOpen, userRole }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'signals', label: 'Signals', icon: SignalsIcon },
    { id: 'performance', label: 'Bot Performance', icon: BotIcon },
    { id: 'history', label: 'History', icon: HistoryIcon },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Mobile Sidebar Close Button */}
      <button className="sidebar-close-btn" onClick={() => setIsOpen(false)} title="Close Menu">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div className="sidebar-top">
        {/* Brand Logo */}
        <div className="sidebar-logo-container">
          <div className="sidebar-title">ProTrader</div>
          <div className="sidebar-subtitle">TERMINAL V2.4</div>
        </div>

        {/* Menu Items */}
        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} className="sidebar-item-icon" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Deploy Bot Button */}
      {userRole === 'admin' && (
        <div className="sidebar-footer">
          <button className="btn btn-primary deploy-btn" onClick={onDeployBotClick}>
            <PlusIcon size={18} />
            <span>Deploy Bot</span>
          </button>
        </div>
      )}
    </aside>
  );
};
