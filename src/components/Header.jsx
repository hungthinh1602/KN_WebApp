import React from 'react';
import { SearchIcon, NotificationIcon, SettingsIcon } from './Icons';

export const Header = ({ 
  activeTab, 
  searchTerm, 
  setSearchTerm, 
  portfolioValue,
  activeBotId,
  setActiveBotId,
  runningBots,
  onMenuClick,
  userRole,
  setUserRole
}) => {
  const handleLogout = () => {
    localStorage.removeItem('protrader_role');
    setUserRole('guest');
    alert("🔒 Đã đăng xuất khỏi quyền Admin!");
  };

  const handleLoginClick = async () => {
    const password = prompt("Nhập mật khẩu Admin:");
    if (!password) return;
    try {
      const res = await fetch(`/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        localStorage.setItem('protrader_role', 'admin');
        setUserRole('admin');
        alert("🔓 Đăng nhập Admin thành công!");
      } else {
        const errData = await res.json();
        alert(`❌ Đăng nhập thất bại: ${errData.error || 'Sai mật khẩu!'}`);
      }
    } catch (e) {
      alert(`❌ Lỗi kết nối máy chủ: ${e.message}`);
    }
  };

  // Determine dynamic placeholder based on current tab
  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Tìm kiếm tài sản, bot...';
      case 'signals':
        return 'Search bots, assets, signals...';
      case 'performance':
        return 'Search bots, assets, signals...';
      case 'history':
        return 'Tìm kiếm cặp tiền, mã lệnh...';
      default:
        return 'Search...';
    }
  };

  return (
    <header className="header">
      {/* Mobile Menu Toggle Button */}
      <button className="header-btn mobile-menu-toggle" onClick={onMenuClick} title="Menu">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Search Bar */}
      <div className="header-search-container">
        <SearchIcon className="header-search-icon" />
        <input
          type="text"
          placeholder={getSearchPlaceholder()}
          className="input-field header-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Right Side Stats & Actions */}
      <div className="header-right">
        {/* Active Bot Dropdown Selector */}
        <div className="flex align-center gap-8" style={{ marginRight: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BOT:</span>
          <select 
            className="input-field select-field" 
            style={{ width: '170px', height: '38px', padding: '0 28px 0 12px', fontSize: '13px', fontWeight: '600', margin: 0 }}
            value={activeBotId}
            onChange={(e) => setActiveBotId(e.target.value)}
          >
            <option value="all">Tất cả các Bot</option>
            {runningBots && runningBots.map(bot => (
              <option key={bot.id} value={bot.id}>
                {bot.isMt5 ? `MT5: ${bot.name}` : bot.name}
              </option>
            ))}
          </select>
        </div>

        {/* Portfolio Stats */}
        <div className="header-portfolio">
          <div className="header-portfolio-label">Portfolio Value</div>
          <div className="header-portfolio-value">${portfolioValue ? portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '142,504.22'}</div>
        </div>

        {/* Notifications Button */}
        <button className="header-btn" title="Notifications">
          <NotificationIcon size={18} />
        </button>

        {/* Settings Button */}
        <button className="header-btn" title="Settings">
          <SettingsIcon size={18} />
        </button>

        {/* Admin Login/Logout Button */}
        {userRole === 'admin' ? (
          <button 
            onClick={handleLogout} 
            className="btn" 
            style={{ 
              height: '38px', 
              padding: '0 14px', 
              backgroundColor: 'rgba(239, 68, 68, 0.15)', 
              color: 'var(--color-danger-text)', 
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }} />
            Admin (Logout)
          </button>
        ) : (
          <button 
            onClick={handleLoginClick} 
            className="btn" 
            style={{ 
              height: '38px', 
              padding: '0 14px', 
              backgroundColor: 'rgba(59, 130, 246, 0.15)', 
              color: 'var(--color-accent)', 
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🔑 Login Admin
          </button>
        )}

        {/* User Profile Avatar */}
        <div className="header-avatar" title="User Profile">
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
            <rect width="100" height="100" fill="#111a2e" />
            <circle cx="50" cy="40" r="22" fill="#3b82f6" fillOpacity="0.4" />
            <circle cx="50" cy="40" r="16" fill="#60a5fa" fillOpacity="0.6" />
            <path d="M50 14 C36 14, 25 25, 25 38 C25 45, 29 52, 35 56 C38 58, 41 54, 50 54 C59 54, 62 58, 65 56 C71 52, 75 45, 75 38 C75 25, 64 14, 50 14 Z" fill="#93c5fd" />
            <path d="M15 88 C15 70, 30 62, 50 62 C70 62, 85 70, 85 88 Z" fill="#1e3a8a" />
            <circle cx="38" cy="38" r="2" fill="#ffffff" />
            <circle cx="62" cy="38" r="2" fill="#ffffff" />
            <path d="M 45 46 Q 50 49 55 46" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />
            <rect x="25" y="80" width="50" height="6" fill="#3b82f6" rx="3" />
          </svg>
        </div>
      </div>
    </header>
  );
};
