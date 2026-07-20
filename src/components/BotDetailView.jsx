import React from 'react';
import { 
  ArrowLeftIcon,
  LightningIcon, 
  WalletIcon, 
  TrophyIcon, 
  RefreshIcon,
  TrendUpIcon
} from './Icons';
import { SignalsView } from './SignalsView';

export const BotDetailView = ({ 
  bot, 
  onBack, 
  onSync,
  recentSignals,
  historyDeals,
  userRole
}) => {
  if (!bot) return null;

  const isCent = bot.currency === 'USC' || bot.currency === 'CENT' || (bot.currency && bot.currency.toLowerCase().includes('cent'));
  
  const formatCurrency = (val) => {
    const formatted = val.toLocaleString(undefined, { minimumFractionDigits: 2 });
    return isCent ? `${formatted} USC` : `$${formatted}`;
  };

  // Lọc signals (lệnh đang mở) của riêng bot này
  const botSignals = recentSignals.filter(sig => 
    sig.botName.includes(bot.name) || (bot.isMt5 && sig.botName.includes(`MT5 (${bot.mt5Login})`))
  );

  return (
    <div className="flex flex-col gap-24">
      {/* Header */}
      <div className="flex justify-between align-center">
        <div className="flex align-center gap-16">
          <button 
            onClick={onBack}
            className="btn btn-secondary" 
            style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent' }}
          >
            <ArrowLeftIcon size={20} />
          </button>
          <div>
            <div className="flex align-center gap-8">
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>{bot.name}</h1>
              {bot.isMt5 && (
                <span className="badge" style={{ fontSize: '10px', color: '#60a5fa', backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  MT5 MONITOR ({bot.mt5Login})
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{bot.pair} • {bot.strategy}</p>
          </div>
        </div>

        {bot.isMt5 && (
          <button 
            onClick={() => onSync && onSync(bot)}
            className="btn btn-primary"
            style={{ gap: '8px', padding: '0 16px' }}
          >
            <RefreshIcon size={16} />
            Cập nhật dữ liệu
          </button>
        )}
      </div>

      {/* Top Metrics Grid */}
      <div className="grid-4">
        <div className="card stat-card">
          <div className="flex-col">
            <div className="stat-label">Số dư hiện tại</div>
            <div className="stat-value text-mono">{formatCurrency(bot.capital || 0)}</div>
          </div>
          <div className="stat-icon-wrapper">
            <WalletIcon size={20} />
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="flex-col">
            <div className="stat-label">Lợi nhuận ròng</div>
            <div className={`stat-value text-mono ${bot.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              {bot.netProfit >= 0 ? '+' : ''}{formatCurrency(bot.netProfit || 0)}
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
            <TrendUpIcon size={20} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="flex-col">
            <div className="stat-label">Tỷ lệ thắng (Win Rate)</div>
            <div className="stat-value text-mono">{(bot.winRate || 0).toFixed(1)}%</div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-accent)' }}>
            <TrophyIcon size={20} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="flex-col">
            <div className="stat-label">Tổng số lệnh (Trades)</div>
            <div className="stat-value text-mono">{(bot.trades || 0).toLocaleString()}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <LightningIcon size={20} />
          </div>
        </div>
      </div>

      {/* Tables Layout */}
      <div className="grid-2" style={{ gap: '24px', alignItems: 'start' }}>
        {/* Open Positions (Signals) */}
        <div className="card" style={{ padding: '20px 0 0 0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0 20px 16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Các lệnh đang mở ({botSignals.length})</h3>
          </div>
          <div className="table-wrapper" style={{ flex: 1, maxHeight: '400px', overflowY: 'auto' }}>
            {botSignals.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Không có lệnh nào đang mở.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Type</th>
                    <th>Entry</th>
                    <th style={{ textAlign: 'right' }}>PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {botSignals.map((sig, i) => (
                    <tr key={i}>
                      <td><span className="font-600">{sig.asset}</span></td>
                      <td>
                        <span className={`badge ${sig.type.toUpperCase() === 'LONG' ? 'badge-long' : 'badge-short'}`}>
                          {sig.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-mono">{sig.entryPrice}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`text-mono ${sig.pnl.includes('+') ? 'text-success' : 'text-danger'}`}>{sig.pnl}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Closed Deals (History) */}
        <div className="card" style={{ padding: '20px 0 0 0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0 20px 16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Lịch sử giao dịch gần đây</h3>
          </div>
          <div className="table-wrapper" style={{ flex: 1, maxHeight: '400px', overflowY: 'auto' }}>
            {historyDeals.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Chưa có lịch sử giao dịch.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Symbol</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {historyDeals.map((deal, i) => {
                    const isProfit = deal.profit >= 0;
                    return (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{deal.time}</td>
                        <td><span className="font-600">{deal.symbol}</span></td>
                        <td>
                           <span style={{ color: deal.type.toUpperCase() === 'LONG' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                             {deal.type}
                           </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                           <span className={`text-mono ${isProfit ? 'text-success' : 'text-danger'}`}>
                             {isProfit ? '+' : ''}{formatCurrency(deal.profit)}
                           </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
