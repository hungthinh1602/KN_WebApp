import React from 'react';
import { CustomChart } from './CustomChart';
import { TrendUpIcon, TrophyIcon, WalletIcon, PlusIcon } from './Icons';

export const DashboardView = ({ 
  runningBots, 
  onViewAllBots, 
  onDeployBotClick, 
  searchTerm,
  activeInterval,
  setActiveInterval,
  activeBotId,
  setActiveBotId,
  userRole
}) => {
  
  // Filter running bots based on search input
  const filteredBots = runningBots.filter(bot => 
    bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.pair.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Hot pairs data
  const hotPairs = [
    { name: 'BTC / USDT', fullName: 'Bitcoin', price: '$68,421.50', change: '+2.45%', isPositive: true },
    { name: 'ETH / USDT', fullName: 'Ethereum', price: '$2,450.12', change: '+1.12%', isPositive: true },
    { name: 'SOL / USDT', fullName: 'Solana', price: '$165.30', change: '-0.82%', isPositive: false }
  ];

  // Dynamic calculations based on selected active bot
  const selectedBot = activeBotId === 'all' ? null : runningBots.find(b => b.id === activeBotId);

  // 1. Profit Today display
  const profitToday = selectedBot ? selectedBot.profit : 1240.55;
  const isProfitPositive = profitToday >= 0;

  // 2. Win Rate display
  const winRate = selectedBot ? selectedBot.winRate : 72.4;
  const tradesCount = selectedBot ? selectedBot.trades : 150;

  const formatCurrency = (val, currency) => {
    const isCent = currency === 'USC' || currency === 'CENT' || (currency && currency.toLowerCase().includes('cent'));
    const formatted = val.toLocaleString(undefined, { minimumFractionDigits: 2 });
    return isCent ? `${formatted} USC` : `$${formatted}`;
  };

  // 3. Total Assets display
  const totalAssetsVal = selectedBot ? (selectedBot.capital ?? 0) : 84202.10;

  return (
    <div className="flex flex-col gap-24">
      {/* Top Stats Cards */}
      <div className="grid-3">
        {/* Card 1: Profit Today */}
        <div className="card stat-card" style={{ borderLeft: activeBotId !== 'all' && selectedBot ? `3px solid ${isProfitPositive ? 'var(--color-success)' : 'var(--color-danger)'}` : '1px solid var(--border-color)' }}>
          <div className="flex-col">
            <div className="stat-label">Lợi nhuận nay {selectedBot ? `(${selectedBot.name})` : '(Tất cả)'}</div>
            <div className={`stat-value ${isProfitPositive ? 'text-success' : 'text-danger'}`}>
              {isProfitPositive ? '+' : ''}{formatCurrency(profitToday, selectedBot ? selectedBot.currency : 'USD')}
            </div>
            <div className={`stat-sub ${isProfitPositive ? 'text-success' : 'text-danger'}`}>
              <TrendUpIcon size={12} className={isProfitPositive ? '' : 'trend-down'} />
              <span>{isProfitPositive ? '+4.2%' : '-1.5%'} hôm nay</span>
            </div>
          </div>
          <div 
            className="stat-icon-wrapper" 
            style={{ 
              backgroundColor: isProfitPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
              color: isProfitPositive ? 'var(--color-success)' : 'var(--color-danger)' 
            }}
          >
            <TrendUpIcon size={20} />
          </div>
        </div>

        {/* Card 2: Win Rate */}
        <div className="card stat-card">
          <div className="flex-col">
            <div className="stat-label">Win Rate {selectedBot ? `(${selectedBot.name})` : '(Tất cả)'}</div>
            <div className="stat-value">{winRate.toFixed(1)}%</div>
            <div className="stat-sub" style={{ color: 'var(--text-secondary)' }}>
              <span>Dựa trên {tradesCount.toLocaleString()} trades</span>
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-accent)' }}>
            <TrophyIcon size={20} />
          </div>
        </div>

        {/* Card 3: Total Assets */}
        <div className="card stat-card">
          <div className="flex-col">
            <div className="stat-label">Vốn đầu tư {selectedBot ? `(${selectedBot.name})` : '(Tất cả)'}</div>
            <div className="stat-value text-mono">{formatCurrency(totalAssetsVal, selectedBot ? selectedBot.currency : 'USD')}</div>
            <div className="stat-sub" style={{ color: 'var(--color-accent)' }}>
              <span>{selectedBot ? (selectedBot.isMt5 ? `Tài sản thật MT5 (${selectedBot.currency || 'USD'})` : `Vốn phân bổ (${selectedBot.currency || 'USD'})`) : 'Đang được quản lý'}</span>
            </div>
          </div>
          <div className="stat-icon-wrapper">
            <WalletIcon size={20} />
          </div>
        </div>
      </div>

      {/* Interactive Main Chart */}
      <div className="card" style={{ padding: '24px' }}>
        <CustomChart activeInterval={activeInterval} onIntervalChange={setActiveInterval} />
      </div>

      {/* Dashboard Sub-grid (Bots + Hot Pairs) */}
      <div className="dashboard-grid">
        {/* Running Bots Section */}
        <div className="card" style={{ padding: '20px 0 0 0', display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between align-center" style={{ padding: '0 20px 16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Bots đang chạy</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Click vào một hàng để xem chi tiết dữ liệu bot đó</p>
            </div>
            <button 
              onClick={onViewAllBots}
              style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
            >
              Xem tất cả
            </button>
          </div>
          
          <div className="table-wrapper" style={{ flex: 1 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên Bot</th>
                  <th>Cặp Tiền</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: 'right' }}>Lợi Nhuận</th>
                </tr>
              </thead>
              <tbody>
                {filteredBots.length > 0 ? (
                  filteredBots.map((bot) => {
                    const isActive = activeBotId === bot.id;
                    return (
                      <tr 
                        key={bot.id}
                        onClick={() => setActiveBotId(isActive ? 'all' : bot.id)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <td style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: bot.status === 'RUNNING' ? 'var(--color-success)' : 'var(--color-paused)'
                          }} />
                          <span style={{ borderBottom: isActive ? '1px dashed var(--color-accent)' : 'none' }}>
                            {bot.name}
                          </span>
                        </td>
                        <td className="text-mono">{bot.pair}</td>
                        <td>
                          <span className={`badge ${bot.status === 'RUNNING' ? 'badge-running' : 'badge-paused'}`}>
                            {bot.status}
                          </span>
                        </td>
                        <td className={`text-mono ${bot.profit >= 0 ? 'text-success' : 'text-danger'}`} style={{ textAlign: 'right', fontWeight: '700' }}>
                          {bot.profit >= 0 ? '+' : ''}{formatCurrency(bot.profit, bot.currency)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      Không tìm thấy bot nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hot Pairs Section */}
        <div className="card" style={{ padding: '20px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between align-center" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Cặp tiền Hot nhất</h3>
            <span 
              className="badge" 
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '9px' }}
            >
              LIVE UPDATES
            </span>
          </div>

          <div className="flex-col gap-12" style={{ flex: 1 }}>
            {hotPairs.map((pair, idx) => (
              <div 
                key={idx} 
                className="flex justify-between align-center"
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  transition: 'background var(--transition-fast)'
                }}
              >
                <div className="flex align-center gap-12">
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: pair.isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '11px',
                    color: pair.isPositive ? 'var(--color-success)' : 'var(--color-danger)'
                  }}>
                    {pair.name.split(' ')[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{pair.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pair.fullName}</div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{pair.price}</div>
                  <div className={`text-mono ${pair.isPositive ? 'text-success' : 'text-danger'}`} style={{ fontSize: '11px', fontWeight: '500' }}>
                    {pair.change}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Deploy Bot FAB */}
          {userRole === 'admin' && (
            <button 
              className="btn btn-primary btn-icon-only" 
              onClick={onDeployBotClick}
              style={{ 
                position: 'absolute', 
                right: '20px', 
                bottom: '20px', 
                borderRadius: '50%', 
                width: '46px', 
                height: '46px',
                boxShadow: 'var(--shadow-glow)'
              }}
              title="Deploy New Bot"
            >
              <PlusIcon size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
