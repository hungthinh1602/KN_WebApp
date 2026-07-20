import React, { useState } from 'react';
import { 
  TrendUpIcon, 
  WalletIcon, 
  LightningIcon, 
  PlusIcon,
  ExportIcon,
  FilterIcon
} from './Icons';

// Sub-component for rendering a 7-day mini chart in the bot cards
const BotPerformanceChart = ({ type }) => {
  const getGradientId = () => `pnlGrad-${type}`;
  
  const getStrokeColor = () => {
    if (type === 'nexus') return 'var(--color-success)';
    if (type === 'grid') return '#60a5fa';
    if (type === 'trend') return 'var(--color-danger)';
    return 'var(--text-secondary)';
  };

  const getPaths = () => {
    if (type === 'nexus') {
      return {
        line: 'M 0 60 L 40 55 L 80 68 L 120 48 L 160 52 L 200 32 L 240 38 L 280 15',
        area: 'M 0 60 L 40 55 L 80 68 L 120 48 L 160 52 L 200 32 L 240 38 L 280 15 L 280 80 L 0 80 Z'
      };
    }
    if (type === 'grid') {
      return {
        line: 'M 0 65 L 40 60 L 80 62 L 120 45 L 160 55 L 200 40 L 240 42 L 280 32',
        area: 'M 0 65 L 40 60 L 80 62 L 120 45 L 160 55 L 200 40 L 240 42 L 280 32 L 280 80 L 0 80 Z'
      };
    }
    if (type === 'trend') {
      return {
        line: 'M 0 20 L 40 22 L 80 20 L 120 38 L 160 42 L 200 55 L 240 58 L 280 65',
        area: 'M 0 20 L 40 22 L 80 20 L 120 38 L 160 42 L 200 55 L 240 58 L 280 65 L 280 80 L 0 80 Z'
      };
    }
    // Default flat/slight up for user-deployed bots
    return {
      line: 'M 0 50 L 40 48 L 80 50 L 120 46 L 160 47 L 200 42 L 240 44 L 280 38',
      area: 'M 0 50 L 40 48 L 80 50 L 120 46 L 160 47 L 200 42 L 240 44 L 280 38 L 280 80 L 0 80 Z'
    };
  };

  const paths = getPaths();
  const strokeColor = getStrokeColor();

  return (
    <div className="bot-card-chart">
      <svg width="100%" height="80" viewBox="0 0 280 80" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={getGradientId()} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Filled Gradient Area */}
        <path d={paths.area} fill={`url(#${getGradientId()})`} />
        {/* Stroke Line */}
        <path d={paths.line} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const BotPerformanceView = ({ 
  runningBots, 
  recentSignals, 
  onDeployBotClick, 
  searchTerm,
  activeBotId,
  setActiveBotId,
  onDeleteBot,
  onViewBot,
  userRole
}) => {
  // Timeframe filter state: 'day', 'week', 'month'
  const [timeFilter, setTimeFilter] = useState('week');

  const tgConfig = JSON.parse(localStorage.getItem('protrader_telegram_config') || '{"token":"","chatId":"","botChatId":"","autoSend":false}');

  const sendTelegramNotification = async (text, customChatId) => {
    const targetChat = customChatId || tgConfig.botChatId || tgConfig.chatId;
    if (!tgConfig.token || !targetChat) return false;
    try {
      const url = `https://api.telegram.org/bot${tgConfig.token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChat,
          text: text
        })
      });
      const data = await response.json();
      return data.ok;
    } catch (e) {
      console.error("Telegram send error:", e);
      return false;
    }
  };

  const handleSendBotStatsTelegram = () => {
    const targetChat = tgConfig.botChatId || tgConfig.chatId;
    if (!tgConfig.token || !targetChat) {
      alert("⚠️ Vui lòng cấu hình Bot Token và ít nhất một Chat ID ở mục Signals trước khi gửi báo cáo!");
      return;
    }

    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    const todayStr = formatDate(today);

    let title = '🤖 [BÁO CÁO HIỆU SUẤT NGÀY KN TRADING BOT]';
    let timeRangeStr = todayStr;
    const multiplier = timeFilter === 'day' ? 0.2 : timeFilter === 'week' ? 1.0 : 4.5;

    if (timeFilter === 'week') {
      title = '🤖 [BÁO CÁO HIỆU SUẤT TUẦN KN TRADING BOT]';
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 7);
      timeRangeStr = `${formatDate(pastDate)} - ${todayStr}`;
    } else if (timeFilter === 'month') {
      title = '🤖 [BÁO CÁO HIỆU SUẤT THÁNG KN TRADING BOT]';
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 30);
      timeRangeStr = `${formatDate(pastDate)} - ${todayStr}`;
    }

    // Group totals by currency
    const usdPool = runningBots.filter(b => !(b.currency === 'USC' || b.currency === 'CENT' || (b.currency && b.currency.toLowerCase().includes('cent'))));
    const centPool = runningBots.filter(b => b.currency === 'USC' || b.currency === 'CENT' || (b.currency && b.currency.toLowerCase().includes('cent')));

    const usdPnl = usdPool.reduce((sum, b) => sum + (b.netProfit * multiplier), 0);
    const usdCapital = usdPool.reduce((sum, b) => sum + (b.capital || 1), 0);
    const usdPct = (usdPnl / usdCapital) * 100;

    const centPnl = centPool.reduce((sum, b) => sum + (b.netProfit * multiplier), 0);
    const centCapital = centPool.reduce((sum, b) => sum + (b.capital || 1), 0);
    const centPct = (centPnl / centCapital) * 100;

    let profitSummaryText = '';
    if (usdPool.length > 0 && centPool.length > 0) {
      profitSummaryText = `${usdPnl >= 0 ? '+' : ''}$${Math.floor(usdPnl).toLocaleString()} (${usdPct >= 0 ? '+' : ''}${usdPct.toFixed(1)}%) và ${centPnl >= 0 ? '+' : ''}${Math.floor(centPnl).toLocaleString()} USC (${centPct >= 0 ? '+' : ''}${centPct.toFixed(1)}%)`;
    } else if (centPool.length > 0) {
      profitSummaryText = `${centPnl >= 0 ? '+' : ''}${Math.floor(centPnl).toLocaleString()} USC (${centPct >= 0 ? '+' : ''}${centPct.toFixed(1)}%)`;
    } else {
      profitSummaryText = `${usdPnl >= 0 ? '+' : ''}$${Math.floor(usdPnl).toLocaleString()} (${usdPct >= 0 ? '+' : ''}${usdPct.toFixed(1)}%)`;
    }

    const activeBotsCount = runningBots.filter(b => b.status === 'RUNNING').length;

    const botDetails = runningBots.map(b => {
      const botPnl = b.netProfit * multiplier;
      const pnlSign = botPnl >= 0 ? '+' : '';
      const isCent = b.currency === 'USC' || b.currency === 'CENT' || (b.currency && b.currency.toLowerCase().includes('cent'));
      const pnlFormatted = isCent ? `${Math.floor(botPnl).toLocaleString()} USC` : `$${Math.floor(botPnl).toLocaleString()}`;
      
      const botCapital = b.capital || 1;
      const profitPercent = (botPnl / botCapital) * 100;
      const pctSign = profitPercent >= 0 ? '+' : '';

      return `• ${b.name} (${b.pair}): ${pnlSign}${pnlFormatted} (${pctSign}${profitPercent.toFixed(1)}%)`;
    }).join('\n');

    const text = `${title}
Thời gian: ${timeRangeStr}
------------------
📈 Tổng lợi nhuận: ${profitSummaryText}
🔥 Số Bot đang chạy: ${activeBotsCount}/${runningBots.length}
------------------
📊 Chi tiết hoạt động:
${botDetails}
==========
📬©KN Invest`;

    sendTelegramNotification(text, targetChat).then(success => {
      if (success) {
        alert("🚀 Đã gửi báo cáo hiệu suất Trading Bots lên Telegram!");
      } else {
        alert("❌ Lỗi gửi báo cáo lên Telegram!");
      }
    });
  };

  // Filter bots based on header search
  const filteredBots = runningBots.filter(bot => 
    bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.strategy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedBot = activeBotId === 'all' ? null : runningBots.find(b => b.id === activeBotId);

  // Filter signals based on selected bot AND search query
  const filteredSignals = recentSignals.filter(sig => {
    const matchesSearch = sig.botName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sig.asset.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBot = !selectedBot || 
                       sig.botName.includes(selectedBot.name) || 
                       (selectedBot.isMt5 && sig.botName.includes('MT5'));
                       
    return matchesSearch && matchesBot;
  });

  // Dynamic calculations for Win Rate and PnL widgets based on activeBotId and timeFilter
  const getDynamicStats = () => {
    let baseWinRate = 68.4;
    let basePnl = 12402.18;

    if (selectedBot) {
      baseWinRate = selectedBot.winRate;
      if (timeFilter === 'day') basePnl = selectedBot.netProfitDay !== undefined ? selectedBot.netProfitDay : selectedBot.profit;
      else if (timeFilter === 'week') basePnl = selectedBot.netProfitWeek !== undefined ? selectedBot.netProfitWeek : selectedBot.netProfit;
      else if (timeFilter === 'month') basePnl = selectedBot.netProfitMonth !== undefined ? selectedBot.netProfitMonth : selectedBot.netProfit * 4.5;
      else basePnl = selectedBot.netProfit;
    } else {
      // average win rate of running bots
      const totalWin = runningBots.reduce((sum, b) => sum + b.winRate, 0);
      baseWinRate = runningBots.length > 0 ? totalWin / runningBots.length : 68.4;
      
      if (timeFilter === 'day') {
        basePnl = runningBots.reduce((sum, b) => sum + (b.netProfitDay !== undefined ? b.netProfitDay : b.profit), 0);
      } else if (timeFilter === 'week') {
        basePnl = runningBots.reduce((sum, b) => sum + (b.netProfitWeek !== undefined ? b.netProfitWeek : b.netProfit), 0);
      } else if (timeFilter === 'month') {
        basePnl = runningBots.reduce((sum, b) => sum + (b.netProfitMonth !== undefined ? b.netProfitMonth : b.netProfit * 4.5), 0);
      } else {
        basePnl = runningBots.reduce((sum, b) => sum + b.netProfit, 0);
      }
    }

    // Adjust based on timeframe filter for mock win rates
    if (timeFilter === 'day') {
      baseWinRate = baseWinRate * 0.95; // slight variance
    } else if (timeFilter === 'month') {
      baseWinRate = baseWinRate * 1.05 > 100 ? 98.5 : baseWinRate * 1.05; // slight increase
    }

    return {
      winRate: Math.min(100, Math.max(0, baseWinRate)),
      pnl: basePnl
    };
  };

  const formatCurrency = (val, currency) => {
    const isCent = currency === 'USC' || currency === 'CENT' || (currency && currency.toLowerCase().includes('cent'));
    const formatted = val.toLocaleString(undefined, { minimumFractionDigits: 2 });
    return isCent ? `${formatted} USC` : `$${formatted}`;
  };

  const dynamicStats = getDynamicStats();
  const isPnlPositive = dynamicStats.pnl >= 0;

  return (
    <div className="flex flex-col gap-24">
      {/* Page Title & Top Metric Widgets */}
      <div className="flex justify-between align-center">
        <div>
          <h1 className="page-title">Bot Performance Results</h1>
          <p className="page-description">Real-time execution metrics and algorithmic efficiency tracking.</p>
        </div>

        {/* Dynamic Widget Panels & Time Filter */}
        <div className="flex align-center gap-16">
          <button 
            type="button"
            className="btn btn-secondary" 
            style={{ height: '34px', fontSize: '11px', fontWeight: '700', borderColor: 'rgba(96, 165, 250, 0.2)', color: 'var(--color-accent)' }}
            onClick={handleSendBotStatsTelegram}
          >
            🤖 Báo cáo Bot lên Telegram
          </button>

          {/* Time Filter Pills */}
          <div className="filter-pills" style={{ marginRight: '8px' }}>
            {['day', 'week', 'month'].map((f) => (
              <button
                key={f}
                className={`filter-pill ${timeFilter === f ? 'active' : ''}`}
                onClick={() => setTimeFilter(f)}
                style={{ textTransform: 'capitalize' }}
              >
                {f === 'day' ? 'Ngày' : f === 'week' ? 'Tuần' : 'Tháng'}
              </button>
            ))}
          </div>

          {/* Win Rate Widget */}
          <div className="card flex align-center gap-12" style={{ padding: '10px 16px', borderRadius: 'var(--border-radius-sm)', borderLeft: '3px solid var(--color-success)' }}>
            <div className="stat-icon-wrapper" style={{ width: '32px', height: '32px', border: 'none', backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-success)' }}>
              <TrendUpIcon size={16} />
            </div>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                WIN RATE ({timeFilter === 'day' ? 'NÀY' : timeFilter === 'week' ? '7D' : '30D'})
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-success-text)' }}>
                {dynamicStats.winRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Profit Widget */}
          <div className="card flex align-center gap-12" style={{ padding: '10px 16px', borderRadius: 'var(--border-radius-sm)', borderLeft: `3px solid ${isPnlPositive ? 'var(--color-accent)' : 'var(--color-danger)'}` }}>
            <div className="stat-icon-wrapper" style={{ width: '32px', height: '32px', border: 'none', backgroundColor: isPnlPositive ? 'rgba(59, 130, 246, 0.08)' : 'rgba(239, 68, 68, 0.08)', color: isPnlPositive ? 'var(--color-accent)' : 'var(--color-danger)' }}>
              <WalletIcon size={16} />
            </div>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PNL ({timeFilter === 'day' ? 'NÀY' : timeFilter === 'week' ? '7D' : '30D'})
              </div>
              <div className={`text-mono`} style={{ fontSize: '15px', fontWeight: '700', color: isPnlPositive ? 'var(--text-primary)' : 'var(--color-danger-text)' }}>
                {isPnlPositive ? '+' : ''}{formatCurrency(dynamicStats.pnl, selectedBot ? selectedBot.currency : 'USD')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Cards Grid */}
      <div className="grid-3">
        {filteredBots.map((bot) => {
          // Identify chart type
          let chartType = 'custom';
          if (bot.name.includes('Nexus') || bot.name.includes('Alpha')) chartType = 'nexus';
          else if (bot.name.includes('Grid')) chartType = 'grid';
          else if (bot.name.includes('Trend')) chartType = 'trend';

          const isActive = activeBotId === bot.id;

          // Adjust card metrics based on timeframe filter
          let botWinRate = bot.winRate;
          let botTrades = bot.trades;
          let botNetProfit = bot.netProfit;

          if (timeFilter === 'day') {
            botWinRate = botWinRate * 0.96;
            botTrades = Math.max(1, Math.floor(bot.trades * 0.03));
            botNetProfit = bot.netProfitDay !== undefined ? bot.netProfitDay : bot.profit; // current floating/today's profit
          } else if (timeFilter === 'week') {
            botNetProfit = bot.netProfitWeek !== undefined ? bot.netProfitWeek : bot.netProfit;
          } else if (timeFilter === 'month') {
            botWinRate = Math.min(100, botWinRate * 1.03);
            botTrades = bot.trades * 4.2;
            botNetProfit = bot.netProfitMonth !== undefined ? bot.netProfitMonth : bot.netProfit * 4.5;
          }

          return (
            <div 
              key={bot.id} 
              className="card" 
              onClick={() => setActiveBotId(isActive ? 'all' : bot.id)}
              style={{ 
                padding: '20px',
                cursor: 'pointer',
                borderColor: isActive ? 'var(--color-accent)' : 'var(--border-color)',
                boxShadow: isActive ? 'var(--shadow-glow)' : 'var(--shadow-md)',
                transform: isActive ? 'translateY(-2px)' : 'none',
                transition: 'all var(--transition-fast)'
              }}
            >
              {/* Bot Header */}
              <div className="flex justify-between align-center" style={{ marginBottom: '6px' }}>
                <div className="flex align-center gap-12">
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: bot.status === 'RUNNING' ? 'var(--color-success)' : 'var(--color-paused)'
                  }}>
                    <LightningIcon size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{bot.name}</h3>
                    {bot.isMt5 ? (
                      <span className="badge" style={{ fontSize: '9px', color: '#60a5fa', backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1px 6px', borderRadius: '4px' }}>
                        MT5 MONITOR
                      </span>
                    ) : (
                      <span className="badge" style={{ fontSize: '9px', color: 'var(--color-success-text)', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: 'none', textTransform: 'none', padding: 0 }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>STRATEGY</div>
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>{bot.strategy}</div>
                </div>
              </div>

              {/* Trend Label */}
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '16px' }}>7D PnL Trend</div>

              {/* Sparkline chart */}
              <BotPerformanceChart type={chartType} />

              {/* Bot Performance Metrics Grid */}
              <div className="grid-2" style={{ gap: '16px 20px', marginTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>WIN RATE</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: botWinRate >= 50 ? 'var(--color-success-text)' : 'var(--text-primary)' }}>
                    {botWinRate.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>TOTAL TRADES</div>
                  <div className="text-mono" style={{ fontSize: '16px', fontWeight: '600' }}>
                    {Math.floor(botTrades).toLocaleString()}
                  </div>
                </div>
                 <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>AVG PROFIT</div>
                  <div className={`text-mono ${bot.avgProfit >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '14px', fontWeight: '600' }}>
                    {bot.avgProfit >= 0 ? '+' : ''}{formatCurrency(bot.avgProfit, bot.currency)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>NET PROFIT</div>
                  <div className={`text-mono ${botNetProfit >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '14px', fontWeight: '700' }}>
                    {botNetProfit >= 0 ? '+' : ''}{formatCurrency(botNetProfit, bot.currency)}
                  </div>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="grid-2" style={{ gap: '10px', marginTop: '16px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (bot.isMt5 && onViewBot) onViewBot(bot);
                  }}
                  className="btn btn-primary"
                  style={{
                    height: '32px',
                    fontSize: '11px',
                    fontWeight: '600',
                    justifyContent: 'center',
                    opacity: bot.isMt5 ? 1 : 0.5,
                    cursor: bot.isMt5 ? 'pointer' : 'not-allowed'
                  }}
                  disabled={!bot.isMt5}
                >
                  XEM BOT
                </button>
                {userRole === 'admin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBot(bot.id);
                    }}
                    className="btn btn-secondary"
                    style={{
                      height: '32px',
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                      color: 'var(--color-danger)',
                      fontSize: '11px',
                      fontWeight: '600',
                      justifyContent: 'center'
                    }}
                  >
                    Xóa lưu trữ
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Live Signals Table */}
      <div className="card" style={{ padding: '20px 0 0 0' }}>
        <div className="flex justify-between align-center" style={{ padding: '0 20px 16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
              Recent Live Signals {selectedBot ? `(${selectedBot.name})` : '(Tất cả)'}
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Hiển thị tín hiệu lệnh được thực thi bởi bot đang hoạt động
            </p>
          </div>
          <div className="flex gap-12">
            <button className="btn btn-secondary" onClick={() => alert('Đã xuất báo cáo CSV thành công!')}>
              <ExportIcon size={14} />
              <span>Export CSV</span>
            </button>
            <button className="btn btn-secondary">
              <FilterIcon size={14} />
              <span>Filter</span>
            </button>
             {userRole === 'admin' && (
              <button className="btn btn-primary" onClick={onDeployBotClick}>
                <PlusIcon size={14} />
                <span>Deploy New BOT</span>
              </button>
             )}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>BOT NAME</th>
                <th>ASSET</th>
                <th>TYPE</th>
                <th>ENTRY PRICE</th>
                <th>EXIT PRICE</th>
                <th>PNL</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSignals.length > 0 ? (
                filteredSignals.map((sig, idx) => (
                  <tr key={idx}>
                    <td className="text-mono" style={{ color: 'var(--text-secondary)' }}>{sig.time}</td>
                    <td style={{ fontWeight: '500' }}>{sig.botName}</td>
                    <td className="text-mono">{sig.asset}</td>
                    <td>
                      <span 
                        className="badge" 
                        style={{
                          backgroundColor: sig.type === 'LONG' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: sig.type === 'LONG' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                          border: 'none',
                          fontWeight: '600'
                        }}
                      >
                        {sig.type}
                      </span>
                    </td>
                    <td className="text-mono">${sig.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="text-mono">{sig.exitPrice !== '-' ? `$${sig.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</td>
                    <td className={`text-mono ${sig.pnl.includes('+') ? 'text-success' : sig.pnl === '-' ? '' : 'text-danger'}`} style={{ fontWeight: '600' }}>
                      {sig.pnl}
                    </td>
                    <td>
                      {sig.status === 'COMPLETED' ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success-text)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          {sig.status}
                        </span>
                      ) : sig.status === '-' ? (
                        '-'
                      ) : (
                        <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                          {sig.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Không tìm thấy tín hiệu nào của bot được chọn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
