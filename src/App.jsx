import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SignalsView } from './components/SignalsView';
import { BotPerformanceView } from './components/BotPerformanceView';
import { HistoryView } from './components/HistoryView';
import { DeployBotModal } from './components/DeployBotModal';
import { BotDetailView } from './components/BotDetailView';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const DEFAULT_BOTS = [
  { 
    id: '1', 
    name: 'Alpha Scalper v4', 
    pair: 'BTC/USDT', 
    strategy: 'Scalping V4', 
    status: 'RUNNING', 
    profit: 210.40,
    winRate: 72.4,
    trades: 1248,
    avgProfit: 42.10,
    netProfit: 6240,
    capital: 15000
  },
  { 
    id: '2', 
    name: 'Trend Master', 
    pair: 'ETH/USDT', 
    strategy: 'Momentum', 
    status: 'RUNNING', 
    profit: 85.20,
    winRate: 88.1,
    trades: 4812,
    avgProfit: 1.45,
    netProfit: 4112,
    capital: 25000
  },
  { 
    id: '3', 
    name: 'Grid Neutral', 
    pair: 'SOL/USDT', 
    strategy: 'Neutral Grid', 
    status: 'PAUSED', 
    profit: -12.10,
    winRate: 42.8,
    trades: 342,
    avgProfit: -12.50,
    netProfit: -1402,
    capital: 10000
  }
];

function App() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState('performance');
  const [activeBotId, setActiveBotId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBotForDetail, setSelectedBotForDetail] = useState(null);
  
  // Deploy Bot Modal Visibility State
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  
  // Mobile Sidebar Visibility State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Main Chart interval filter
  const [activeInterval, setActiveInterval] = useState('1W');

  // Multi-Bot Selection State
  // 'all' means all bots combined, or a specific bot ID

  // User Authentication / Authorization State ('admin' or 'guest')
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('protrader_role') || 'guest';
  });

  const lastSavedBotsRef = useRef('');

  // Initialize running bots from localStorage (our Database layer)
  const [runningBots, setRunningBots] = useState(() => {
    const saved = localStorage.getItem('protrader_bots');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved bots from database:", e);
      }
    }
    return DEFAULT_BOTS;
  });

  // Load bots from central database on mount & poll every 5 seconds
  useEffect(() => {
    const fetchBotsFromServer = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bots`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setRunningBots(data);
            lastSavedBotsRef.current = JSON.stringify(data); // Sync ref to prevent immediate re-saving
          }
        }
      } catch (err) {
        console.warn("Failed to load bots from central server, using local fallback:", err);
      }
    };
    fetchBotsFromServer();
    const interval = setInterval(fetchBotsFromServer, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, []);

  // Live Signals State (Shown in Bot Performance view)
  const [recentSignals, setRecentSignals] = useState([
    { time: '14:22:15', botName: 'Alpha Scalper v4', asset: 'BTC/USDT', type: 'LONG', entryPrice: 64242.12, exitPrice: 64510.45, pnl: '+$268.33', status: 'COMPLETED' },
    { time: '14:18:42', botName: 'Trend Master', asset: 'ETH/USDT', type: 'SHORT', entryPrice: 3412.80, exitPrice: 3398.20, pnl: '+$14.60', status: 'COMPLETED' },
    { time: '14:15:01', botName: 'Trend Seeker', asset: 'SOL/USDT', type: 'LONG', entryPrice: 142.15, exitPrice: '-', pnl: '-', status: 'RUNNING' },
    { time: '14:12:30', botName: 'Alpha Scalper v4', asset: 'BTC/USDT', type: 'LONG', entryPrice: 64150.00, exitPrice: 64100.00, pnl: '-$50.00', status: 'COMPLETED' }
  ]);

  // Dynamic MT5 Synced closed deals history
  const [mt5HistoryDeals, setMt5HistoryDeals] = useState([]);

  // Base static portfolio value
  const [basePortfolioValue, setBasePortfolioValue] = useState(142504.22);
  const [portfolioValue, setPortfolioValue] = useState(142504.22);

  // Persistence: Save bots database to localStorage & Central Server when modified
  useEffect(() => {
    localStorage.setItem('protrader_bots', JSON.stringify(runningBots));
    
    const botsStr = JSON.stringify(runningBots);
    if (botsStr === lastSavedBotsRef.current) return; // Skip POST if no changes
    
    const saveBotsToServer = async () => {
      try {
        await fetch(`${API_BASE_URL}/api/bots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: botsStr
        });
        lastSavedBotsRef.current = botsStr;
      } catch (err) {
        console.warn("Failed to save bots to central server:", err);
      }
    };
    saveBotsToServer();
  }, [runningBots]);

  // Auto Reconnect: Handshake MT5 logins saved in database on Web App startup
  useEffect(() => {
    const savedMt5Bots = runningBots.filter(b => b.isMt5);
    savedMt5Bots.forEach(async (bot) => {
      try {
        console.log(`Auto-reconnecting saved MT5 account ${bot.mt5Login} to local bridge...`);
        const response = await fetch(`${API_BASE_URL}/api/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login: bot.mt5Login,
            password: bot.mt5Password,
            server: bot.mt5Server
          })
        });
        if (response.ok) {
          console.log(`Successfully auto-reconnected MT5 account: ${bot.mt5Login}`);
        } else {
          console.warn(`Auto-reconnect returned failed status for account: ${bot.mt5Login}`);
        }
      } catch (err) {
        console.warn(`Local bridge not online. Skipping auto-reconnect for account: ${bot.mt5Login}`);
      }
    });
  }, []); // Run once on startup

  // Background polling removed per user request to avoid auto-login conflicts.
  // Instead, manual sync is triggered via handleSyncBot.
  useEffect(() => {
    const mt5Bots = runningBots.filter(bot => bot.isMt5);
    if (mt5Bots.length === 0) return;

    // Load per-bot cached data from localStorage on mount
    const loadCachedBotData = () => {
      const cachedUpdates = {};
      mt5Bots.forEach(bot => {
        const cacheKey = `mt5_cache_${bot.mt5Login}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try { cachedUpdates[bot.id] = JSON.parse(cached); } catch (e) {}
        }
      });
      if (Object.keys(cachedUpdates).length > 0) {
        setRunningBots(prevBots => prevBots.map(b =>
          cachedUpdates[b.id] ? { ...b, ...cachedUpdates[b.id] } : b
        ));
      }
    };
    loadCachedBotData();
  }, []); // Run once on startup

  // Manual Sync function triggered by "XEM BOT" button
  const handleSyncBot = async (bot) => {
    if (!bot.isMt5) return;
    try {
      // 1. Force Connect/Login to this specific account
      await fetch(`${API_BASE_URL}/api/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: bot.mt5Login,
          password: bot.mt5Password,
          server: bot.mt5Server
        })
      });

      // 2. Fetch the latest data
      const res = await fetch(`${API_BASE_URL}/api/status/${bot.mt5Login}`);
      if (!res.ok) throw new Error("Khong the lay du lieu tu Bridge.");
      const data = await res.json();
      
      if (!data.connected || !data.account) throw new Error(data.error || "Loi ket noi MT5.");

      const deals = data.closed_deals || [];
      const winDeals = deals.filter(d => d.profit > 0).length;
      const totalDeals = deals.length;
      const winRate = totalDeals > 0 ? (winDeals / totalDeals) * 100 : 0;
      const totalNetProfit = deals.reduce((sum, d) => sum + d.profit, 0);
      const avgProfit = totalDeals > 0 ? totalNetProfit / totalDeals : 0.0;

      const now = new Date();
      const oneDay = 24 * 60 * 60 * 1000;
      
      const dealsDay = deals.filter(d => (now - new Date(d.time)) <= oneDay);
      const dealsWeek = deals.filter(d => (now - new Date(d.time)) <= 7 * oneDay);
      const dealsMonth = deals.filter(d => (now - new Date(d.time)) <= 30 * oneDay);

      const netProfitDay = dealsDay.reduce((sum, d) => sum + d.profit, 0);
      const netProfitWeek = dealsWeek.reduce((sum, d) => sum + d.profit, 0);
      const netProfitMonth = dealsMonth.reduce((sum, d) => sum + d.profit, 0);

      const updatedFields = {
        capital: data.account.balance,
        profit: data.account.profit,
        netProfit: totalNetProfit,
        netProfitDay,
        netProfitWeek,
        netProfitMonth,
        currency: data.account.currency || 'USD',
        winRate: winRate,
        trades: totalDeals,
        avgProfit: avgProfit
      };

      // Cache locally
      localStorage.setItem(`mt5_cache_${bot.mt5Login}`, JSON.stringify(updatedFields));

      // Update state
      setRunningBots(prevBots => prevBots.map(b => b.id === bot.id ? { ...b, ...updatedFields } : b));
      setMt5HistoryDeals(deals);

      // Update open positions
      if (data.open_positions) {
        const isCent = data.account.currency === 'USC' || data.account.currency === 'CENT' ||
          (data.account.currency && data.account.currency.toLowerCase().includes('cent'));
        const pnlSuffix = isCent ? ' USC' : '';
        const pnlPrefix = isCent ? '' : '$';
        const signals = data.open_positions.map(pos => ({
          time: pos.time,
          botName: `MT5 (${data.login})`,
          asset: pos.symbol,
          type: pos.type,
          entryPrice: pos.price_open,
          exitPrice: '-',
          pnl: `${pos.profit >= 0 ? '+' : ''}${pnlPrefix}${pos.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}${pnlSuffix}`,
          status: 'RUNNING'
        }));
        
        setRecentSignals(prev => {
          const others = prev.filter(sig => sig.botName !== `MT5 (${data.login})`);
          return [...signals, ...others];
        });
      }
      alert(`✅ Cập nhật dữ liệu thành công cho BOT: ${bot.name}`);
    } catch (err) {
      alert(`❌ Lỗi cập nhật BOT: ${err.message}`);
    }
  };

  const handleViewBot = (bot) => {
    setSelectedBotForDetail(bot);
    setActiveTab('bot-detail');
  };

  // Update header portfolio value based on selected bot
  useEffect(() => {
    if (activeBotId === 'all') {
      const totalFloatingProfit = runningBots.reduce((sum, bot) => sum + (bot.isMt5 ? bot.profit : 0), 0);
      setPortfolioValue(basePortfolioValue + totalFloatingProfit);
    } else {
      const selectedBot = runningBots.find(b => b.id === activeBotId);
      if (selectedBot) {
        setPortfolioValue((selectedBot.capital || 0) + (selectedBot.profit || 0));
      }
    }
  }, [activeBotId, runningBots, basePortfolioValue]);

  // Handler to deploy new bot or connect MT5
  const handleDeployBot = async (newBot) => {
    if (newBot.isMt5) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login: newBot.mt5Login,
            password: newBot.mt5Password,
            server: newBot.mt5Server
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          alert(`Lỗi kết nối MT5: ${errData.error || 'Vui lòng kiểm tra lại thông tin đăng nhập.'}`);
          return;
        }

        const resData = await response.json();
        alert(`Kết nối MT5 thành công!\nAccount: ${resData.account.name || newBot.mt5Login}\nSố dư: $${resData.account.balance.toLocaleString()} ${resData.account.currency || 'USD'}`);
        
        // Build the active MT5 bot config with unique ID
        const mt5Bot = {
          ...newBot,
          id: `mt5_${newBot.mt5Login}_${Date.now()}`,
          pair: `MT5 (${newBot.mt5Login})`,
          capital: resData.account.balance,
          profit: resData.account.profit || 0.00,
          currency: resData.account.currency || 'USD',
          winRate: 74.2, 
          trades: 0,
          avgProfit: 0,
          netProfit: 0
        };

        const updatedBots = [mt5Bot, ...runningBots];
        setRunningBots(updatedBots);
        setActiveBotId(mt5Bot.id); // Automatically switch focus to the new MT5 bot!
        setActiveTab('dashboard');

      } catch (err) {
        alert("Không thể kết nối với Python Bridge!\nHãy chắc chắn rằng bạn đã khởi chạy file 'mt5_bridge.py' trên máy tính.\n\nLệnh chạy: python mt5_bridge.py");
        console.error("Connection failed:", err);
      }
    } else {
      // Normal bot deployment
      const mockWinRate = 50 + Math.random() * 35;
      const mockTrades = 10 + Math.floor(Math.random() * 100);
      const mockAvgProfit = 2 + Math.random() * 20;
      const mockNetProfit = mockTrades * mockAvgProfit;

      const completedBot = {
        ...newBot,
        id: `virtual_${Date.now()}`,
        winRate: mockWinRate,
        trades: mockTrades,
        avgProfit: mockAvgProfit,
        netProfit: mockNetProfit,
        profit: mockAvgProfit * 1.5,
        capital: newBot.capital || 10000
      };

      const updatedBots = [completedBot, ...runningBots];
      setRunningBots(updatedBots);
      setActiveBotId(completedBot.id); // Automatically switch focus to the new bot!

      const timeNow = new Date().toLocaleTimeString('vi-VN', { hour12: false });
      const simulatedSignal = {
        time: timeNow,
        botName: completedBot.name,
        asset: completedBot.pair,
        type: Math.random() > 0.5 ? 'LONG' : 'SHORT',
        entryPrice: completedBot.pair.includes('BTC') ? 68420.50 : completedBot.pair.includes('ETH') ? 3540.20 : 165.30,
        exitPrice: '-',
        pnl: '-',
        status: 'RUNNING'
      };

      setRecentSignals(prev => [simulatedSignal, ...prev]);
      setActiveTab('dashboard');
    }
  };

  // Handler to delete bot configurations from database
  const handleDeleteBot = (botId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa Bot/Tài khoản này khỏi danh sách lưu trữ?")) {
      setRunningBots(prev => prev.filter(b => b.id !== botId));
      if (activeBotId === botId) {
        setActiveBotId('all');
      }
    }
  };

  // Helper to switch view and reset search term
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchTerm(''); // Clear search on tab switch
  };

  // Render active view
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            runningBots={runningBots}
            onViewAllBots={() => handleTabChange('performance')}
            onDeployBotClick={() => setIsDeployModalOpen(true)}
            searchTerm={searchTerm}
            activeInterval={activeInterval}
            setActiveInterval={setActiveInterval}
            activeBotId={activeBotId}
            setActiveBotId={setActiveBotId}
            userRole={userRole}
          />
        );
      case 'signals':
        return <SignalsView searchTerm={searchTerm} userRole={userRole} />;
      case 'performance':
        return (
          <BotPerformanceView 
            runningBots={runningBots} 
            recentSignals={recentSignals}
            onDeployBotClick={() => setIsDeployModalOpen(true)}
            searchTerm={searchTerm}
            activeBotId={activeBotId}
            setActiveBotId={setActiveBotId}
            onDeleteBot={handleDeleteBot}
            onViewBot={handleViewBot}
            userRole={userRole}
          />
        );
      case 'bot-detail':
        return (
          <BotDetailView 
            bot={selectedBotForDetail}
            recentSignals={recentSignals}
            historyDeals={mt5HistoryDeals}
            onBack={() => {
              setSelectedBotForDetail(null);
              setActiveTab('performance');
            }}
            onSync={handleSyncBot}
            userRole={userRole}
          />
        );
      case 'history':
        return (
          <HistoryView 
            searchTerm={searchTerm} 
            activeBotId={activeBotId}
            runningBots={runningBots}
            mt5HistoryDeals={mt5HistoryDeals}
          />
        );
      default:
        return <DashboardView runningBots={runningBots} />;
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          handleTabChange(tab);
          setIsSidebarOpen(false);
        }} 
        onDeployBotClick={() => {
          setIsDeployModalOpen(true);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        userRole={userRole}
      />

      {/* Main Panel Content */}
      <div className="main-content">
        <Header 
          activeTab={activeTab} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          portfolioValue={portfolioValue}
          activeBotId={activeBotId}
          setActiveBotId={setActiveBotId}
          runningBots={runningBots}
          onMenuClick={() => setIsSidebarOpen(true)}
          userRole={userRole}
          setUserRole={setUserRole}
        />
        
        <main className="content-viewport">
          {renderActiveView()}
        </main>
      </div>

      {/* Deploy Bot Hộp Thoại Modal */}
      <DeployBotModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        onDeploy={handleDeployBot}
      />
    </div>
  );
}

export default App;
