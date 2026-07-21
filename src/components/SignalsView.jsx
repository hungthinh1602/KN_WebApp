import React, { useState, useEffect, useRef } from 'react';
import { 
  TrophyIcon, 
  WalletIcon, 
  TrendUpIcon, 
  DashboardIcon, 
  FilterIcon, 
  PlusIcon,
  LightningIcon
} from './Icons';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Initial default signals with 3 TP levels and date properties
const DEFAULT_SIGNALS = [
  {
    id: 'sig_1',
    date: '2026-07-17',
    time: '14:20:00',
    asset: 'XAUUSD (CFD)',
    type: 'SELL',
    entry: 4015.10,
    tp1: 4010.00,
    tp2: 4005.00,
    tp3: 4000.00,
    sl: 4025.00,
    status: 'TP', 
    exitPrice: 4000.00,
    pips: 151.0, 
    tp1Hit: true,
    tp2Hit: true,
    tp3Hit: true,
    closedTime: '14:45:00'
  },
  {
    id: 'sig_2',
    date: '2026-07-17',
    time: '12:10:00',
    asset: 'BTC/USDT',
    type: 'BUY',
    entry: 68150.00,
    tp1: 68500.00,
    tp2: 68800.00,
    tp3: 69000.00,
    sl: 67600.00,
    status: 'TP',
    exitPrice: 69000.00,
    pips: 850.0,
    tp1Hit: true,
    tp2Hit: true,
    tp3Hit: true,
    closedTime: '13:05:00'
  },
  {
    id: 'sig_3',
    date: '2026-07-16',
    time: '09:05:00',
    asset: 'XAUUSD (CFD)',
    type: 'BUY',
    entry: 4018.50,
    tp1: 4022.00,
    tp2: 4025.00,
    tp3: 4028.00,
    sl: 4014.00,
    status: 'SL',
    exitPrice: 4014.00,
    pips: -45.0,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    closedTime: '09:30:00'
  },
  {
    id: 'sig_4',
    date: '2026-07-17',
    time: '15:05:00',
    asset: 'BTC/USDT',
    type: 'BUY',
    entry: 68350.00,
    tp1: 68600.00,
    tp2: 68900.00,
    tp3: 69200.00,
    sl: 68100.00,
    status: 'RUNNING',
    exitPrice: null,
    pips: 0,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    closedTime: null
  }
];

export const SignalsView = ({ searchTerm, userRole }) => {
  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];
  const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"

  // 1. Real-time Market Prices State (fluctuates every 1.5s)
  const [prices, setPrices] = useState({
    BTC: 68420.50,
    XAU: 4017.50
  });

  // Toast status state
  const [toastMsg, setToastMsg] = useState(null);

  // Telegram Config State (from localStorage)
  const [tgConfig, setTgConfig] = useState(() => {
    const saved = localStorage.getItem('protrader_telegram_config');
    return saved ? JSON.parse(saved) : { token: '', chatId: '', botChatId: '', autoSend: false };
  });

  // Load telegram configuration from server on mount
  useEffect(() => {
    const fetchTgConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/telegram-config`);
        if (res.ok) {
          const data = await res.json();
          setTgConfig(data);
          localStorage.setItem('protrader_telegram_config', JSON.stringify(data));
        }
      } catch (err) {
        console.warn("Failed to load telegram config from server:", err);
      }
    };
    fetchTgConfig();
  }, []);

  const [showTgSettings, setShowTgSettings] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  const sendTelegramNotification = async (text, customChatId) => {
    const targetChat = customChatId || tgConfig.chatId;
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

  const handleTestTelegram = async () => {
    let successCount = 0;
    let expectedCount = 0;

    if (tgConfig.token && tgConfig.chatId) {
      expectedCount++;
      const res = await sendTelegramNotification("🔔 [TEST CONNECTION]\nKết nối kênh Tín Hiệu (Signals) thành công từ KN Invest ProTrader!", tgConfig.chatId);
      if (res) successCount++;
    }

    if (tgConfig.token && tgConfig.botChatId) {
      expectedCount++;
      const res = await sendTelegramNotification("🔔 [TEST CONNECTION]\nKết nối kênh Báo Cáo Bot (Bot Performance) thành công từ KN Invest ProTrader!", tgConfig.botChatId);
      if (res) successCount++;
    }

    if (expectedCount === 0) {
      alert("⚠️ Vui lòng cấu hình Bot Token và ít nhất một Chat ID trước khi gửi thử!");
      return;
    }

    if (successCount === expectedCount) {
      showToast("🚀 Gửi tin nhắn thử nghiệm thành công!");
    } else {
      alert(`❌ Gửi thử thất bại! Thành công ${successCount}/${expectedCount}. Vui lòng kiểm tra lại Bot Token, Chat IDs, hoặc đảm bảo Bot đã được thêm làm Admin của các nhóm/kênh.`);
    }
  };

  const notifyPartialTP = (s, level) => {
    if (!tgConfig.token || !tgConfig.chatId) return;
    const formatVal = (v) => Math.round(v);
    const symbol = s.asset.includes('XAU') ? 'XAUUSD' : 'BTCUSD';
    const signalEmoji = s.type === 'BUY' ? '📈' : '📉';
    const tpVal = level === 1 ? s.tp1 : s.tp2;
    
    let portionText = 'Chốt 1/3';
    if (s.tp3 === 0 && s.tp2 > 0) {
      portionText = 'Chốt 1/2';
    }
    
    const text = `🔔 [TÍN HIỆU ĐẠT MỤC TIÊU TP${level}]
Symbol: ${symbol}
${signalEmoji} Signal: ${s.type}
💠 Entry: ${formatVal(s.entry)}
🔷 Target TP${level}: ${formatVal(tpVal)} (Đã khớp - ${portionText})
==========
📬©KN Invest`;
    sendTelegramNotification(text);
  };

  const handleSendStatsTelegram = (timeframe) => {
    if (!tgConfig.token || !tgConfig.chatId) {
      alert("⚠️ Vui lòng cấu hình Bot Token và Chat ID trước khi gửi thống kê!");
      return;
    }

    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];
    const currentYearMonth = todayDateStr.substring(0, 7);

    // Calculate calendar start of week (Monday 00:00:00 local time)
    const currentDayOfWeek = now.getDay();
    const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // Calculate calendar start of month (1st 00:00:00 local time)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Filter signals by timeframe
    const filtered = signals.filter(sig => {
      const sigDate = new Date(sig.date);
      if (timeframe === 'day') {
        return sig.date === todayDateStr;
      } else if (timeframe === 'week') {
        return sigDate >= startOfWeek && sigDate <= now;
      } else if (timeframe === 'month') {
        return sigDate >= startOfMonth && sigDate <= now;
      }
      return false;
    });

    if (filtered.length === 0) {
      showToast(`⚠️ Không có tín hiệu nào trong ${timeframe === 'day' ? 'ngày hôm nay' : timeframe === 'week' ? 'tuần này' : 'tháng này'} để thống kê!`);
      return;
    }

    // Calculations
    const total = filtered.length;
    const completed = filtered.filter(s => s.status === 'TP' || s.status === 'SL' || s.status === 'COMPLETED');
    const winTrades = completed.filter(s => s.pips > 0);
    const winRate = completed.length > 0 ? (winTrades.length / completed.length) * 100 : 0;
    
    const totalPips = filtered.reduce((sum, sig) => {
      if (sig.status !== 'RUNNING') return sum + sig.pips;

      const currentPrice = sig.asset === 'BTC/USDT' ? prices.BTC : prices.XAU;
      const factor = sig.asset === 'BTC/USDT' ? 1.0 : 10.0;
      const hasTp2 = sig.tp2 > 0;
      const hasTp3 = sig.tp3 > 0;
      
      const tp1Pips = sig.type === 'BUY' ? (sig.tp1 - sig.entry) * factor : (sig.entry - sig.tp1) * factor;
      const tp2Pips = hasTp2 ? (sig.type === 'BUY' ? (sig.tp2 - sig.entry) * factor : (sig.entry - sig.tp2) * factor) : 0;
      const currentPips = sig.type === 'BUY' ? (currentPrice - sig.entry) * factor : (sig.entry - currentPrice) * factor;

      let floatingPips = 0;
      if (hasTp3) {
        const portion1Pips = sig.tp1Hit ? tp1Pips : currentPips;
        const portion2Pips = sig.tp2Hit ? tp2Pips : currentPips;
        const portion3Pips = currentPips;
        floatingPips = (portion1Pips * 0.33) + (portion2Pips * 0.33) + (portion3Pips * 0.34);
      } else if (hasTp2) {
        const portion1Pips = sig.tp1Hit ? tp1Pips : currentPips;
        const portion2Pips = currentPips;
        floatingPips = (portion1Pips * 0.5) + (portion2Pips * 0.5);
      } else {
        floatingPips = currentPips;
      }
      return sum + floatingPips;
    }, 0);

    // Asset details
    const xauTrades = filtered.filter(sig => sig.asset.includes('XAU'));
    const btcTrades = filtered.filter(sig => sig.asset.includes('BTC'));

    const getAssetPips = (arr) => arr.reduce((sum, sig) => {
      if (sig.status !== 'RUNNING') return sum + sig.pips;
      const currentPrice = sig.asset === 'BTC/USDT' ? prices.BTC : prices.XAU;
      const factor = sig.asset === 'BTC/USDT' ? 1.0 : 10.0;
      const hasTp2 = sig.tp2 > 0;
      const hasTp3 = sig.tp3 > 0;
      const tp1Pips = sig.type === 'BUY' ? (sig.tp1 - sig.entry) * factor : (sig.entry - sig.tp1) * factor;
      const tp2Pips = hasTp2 ? (sig.type === 'BUY' ? (sig.tp2 - sig.entry) * factor : (sig.entry - sig.tp2) * factor) : 0;
      const currentPips = sig.type === 'BUY' ? (currentPrice - sig.entry) * factor : (sig.entry - currentPrice) * factor;

      if (hasTp3) {
        return sum + (sig.tp1Hit ? tp1Pips : currentPips) * 0.33 + (sig.tp2Hit ? tp2Pips : currentPips) * 0.33 + currentPips * 0.34;
      } else if (hasTp2) {
        return sum + (sig.tp1Hit ? tp1Pips : currentPips) * 0.5 + currentPips * 0.5;
      } else {
        return sum + currentPips;
      }
    }, 0);

    const xauPips = getAssetPips(xauTrades);
    const btcPips = getAssetPips(btcTrades);

    const titleLabel = timeframe === 'day' ? 'HÔM NAY' : timeframe === 'week' ? 'TUẦN NÀY' : 'THÁNG NÀY';
    const dateLabel = timeframe === 'day' 
      ? todayDateStr 
      : timeframe === 'week' 
        ? `${sevenDaysAgo.toISOString().split('T')[0]} tới ${todayDateStr}` 
        : `${currentYearMonth}`;

    const text = `📊 [BÁO CÁO HIỆU SUẤT ${titleLabel}]
Thời gian: ${dateLabel}
------------------
📈 Tổng số lệnh: ${total}
🏆 Tỉ lệ thắng: ${winRate.toFixed(1)}%
💰 Lợi nhuận: ${totalPips >= 0 ? '+' : ''}${totalPips.toFixed(1)} Pips
------------------
🔥 Chi tiết cặp tiền:
• XAUUSD (CFD): ${xauPips >= 0 ? '+' : ''}${xauPips.toFixed(1)} Pips (${xauTrades.length} lệnh)
• BTCUSD: ${btcPips >= 0 ? '+' : ''}${btcPips.toFixed(1)} Pips (${btcTrades.length} lệnh)
==========
📬©KN Invest`;

    sendTelegramNotification(text).then(success => {
      if (success) {
        showToast(`🚀 Đã gửi thống kê ${timeframe === 'day' ? 'ngày' : timeframe === 'week' ? 'tuần' : 'tháng'} lên Telegram!`);
      } else {
        alert("❌ Lỗi gửi thống kê tự động lên Telegram!");
      }
    });
  };

  const handleExportTelegram = (sig) => {
    const formatVal = (v) => Math.round(v);
    const symbol = sig.asset.includes('XAU') ? 'XAUUSD' : 'BTCUSD';
    const signalEmoji = sig.type === 'BUY' ? '📈' : '📉';
    
    let signalTypeStr = sig.type;
    let entryZone = '';

    if (sig.status === 'PENDING') {
      signalTypeStr = sig.type === 'BUY' ? 'BUY LIMIT' : 'SELL LIMIT';
      entryZone = `${formatVal(sig.entry)} (Chờ kích hoạt)`;
    } else {
      if (sig.asset.includes('XAU')) {
        entryZone = sig.type === 'BUY'
          ? `${formatVal(sig.entry - 3)} - ${formatVal(sig.entry + 1)}`
          : `${formatVal(sig.entry - 1)} - ${formatVal(sig.entry + 3)}`;
      } else {
        entryZone = sig.type === 'BUY'
          ? `${formatVal(sig.entry - 150)} - ${formatVal(sig.entry + 50)}`
          : `${formatVal(sig.entry - 50)} - ${formatVal(sig.entry + 150)}`;
      }
    }

    let tpZone = '';
    if (sig.tp3 > 0) {
      tpZone = `${formatVal(sig.tp1)}-${formatVal(sig.tp3)}`;
    } else if (sig.tp2 > 0) {
      tpZone = `${formatVal(sig.tp1)}-${formatVal(sig.tp2)}`;
    } else {
      tpZone = `${formatVal(sig.tp1)}`;
    }

    const text = `Symbol: ${symbol}
${signalEmoji} Signal: ${signalTypeStr}
💠 Entry: ${entryZone}
🔷 TP: ${tpZone}
==========
📬©KN Invest`;

    if (tgConfig.token && tgConfig.chatId) {
      // Auto-send via Bot
      sendTelegramNotification(text).then(success => {
        if (success) {
          showToast("🚀 Đã tự động gửi tín hiệu vào nhóm Telegram!");
        } else {
          showToast("❌ Lỗi gửi Telegram tự động!");
        }
      });
    } else {
      // Fallback to manual clipboard & share URL
      navigator.clipboard.writeText(text).then(() => {
        showToast("📋 Đã sao chép & mở link chia sẻ!");
        const shareUrl = `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`;
        window.open(shareUrl, '_blank');
      }).catch(err => {
        console.error('Failed to copy: ', err);
        alert(text);
      });
    }
  };

  // 2. Signals Database State (loaded from localStorage with format migration)
  const [signals, setSignals] = useState(() => {
    const saved = localStorage.getItem('protrader_community_signals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Safe migration from older formats to prevent crashes
          return parsed.map(sig => {
            const entry = sig.entry !== undefined ? sig.entry : 0;
            const tp1Val = sig.tp1 !== undefined ? sig.tp1 : (sig.tp !== undefined ? sig.tp : entry);
            const tp2Val = sig.tp2 !== undefined ? sig.tp2 : 0;
            const tp3Val = sig.tp3 !== undefined ? sig.tp3 : 0;
            const slVal = sig.sl !== undefined ? sig.sl : 0;
            
            return {
              ...sig,
              entry,
              tp1: tp1Val,
              tp2: tp2Val,
              tp3: tp3Val,
              sl: slVal,
              date: sig.date || todayDateStr,
              time: sig.time || (currentTimeStr + ':00'),
              tp1Hit: sig.tp1Hit !== undefined ? sig.tp1Hit : (sig.status === 'TP'),
              tp2Hit: sig.tp2Hit !== undefined ? sig.tp2Hit : false,
              tp3Hit: sig.tp3Hit !== undefined ? sig.tp3Hit : false,
            };
          });
        }
      } catch (e) {
        console.error("Failed to parse community signals:", e);
      }
    }
    return DEFAULT_SIGNALS;
  });

  const lastSavedSignalsRef = useRef('');

  // Load signals from central database on mount & poll every 5 seconds
  useEffect(() => {
    const fetchSignalsFromServer = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/signals`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSignals(data);
            lastSavedSignalsRef.current = JSON.stringify(data); // Sync ref
          }
        }
      } catch (err) {
        console.warn("Failed to load signals from central server:", err);
      }
    };
    fetchSignalsFromServer();
    const interval = setInterval(fetchSignalsFromServer, 5000); // Poll every 5s!
    return () => clearInterval(interval);
  }, []);

  // Save signals to localStorage when modified client-side
  useEffect(() => {
    localStorage.setItem('protrader_community_signals', JSON.stringify(signals));
  }, [signals]);

  // Helper to save signals list to the central VPS server database
  const saveSignalsToServer = async (updatedSignals) => {
    try {
      const signalsStr = JSON.stringify(updatedSignals);
      await fetch(`${API_BASE_URL}/api/signals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: signalsStr
      });
      lastSavedSignalsRef.current = signalsStr;
    } catch (err) {
      console.warn("Failed to save signals to central server:", err);
    }
  };

  // 3. New Signal Form State
  const [assetInput, setAssetInput] = useState('XAUUSD (CFD)');
  const [typeInput, setTypeInput] = useState('BUY');
  const [entryInput, setEntryInput] = useState('4017.50');
  const [tp1Input, setTp1Input] = useState('4020.50');
  const [tp2Input, setTp2Input] = useState('4023.50');
  const [tp3Input, setTp3Input] = useState('4027.50');
  const [slInput, setSlInput] = useState('4010.50');
  
  // Date and Time inputs (defaults to current system date/time)
  const [dateInput, setDateInput] = useState(todayDateStr);
  const [timeInput, setTimeInput] = useState(currentTimeStr);
  
  // Status inputs for old trade archiving
  const [statusInput, setStatusInput] = useState('RUNNING');
  const [exitPriceInput, setExitPriceInput] = useState('');

  // Trigger price feed updates (Live real-time ticks)
  useEffect(() => {
    const fetchRealTimePrices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/price`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.BTC === 'number' && typeof data.XAU === 'number') {
            setPrices(data);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch live prices, using local simulation:", err);
        // Fallback: local simulation if API is unavailable
        setPrices(prev => {
          const btcDelta = (Math.random() - 0.5) * 5;
          const xauDelta = (Math.random() - 0.5) * 0.15;
          return {
            BTC: parseFloat((prev.BTC + btcDelta).toFixed(2)),
            XAU: parseFloat((prev.XAU + xauDelta).toFixed(2))
          };
        });
      }
    };

    fetchRealTimePrices();
    const interval = setInterval(fetchRealTimePrices, 4000); // refresh every 4 seconds
    return () => clearInterval(interval);
  }, []);

  // Update form inputs with live price on first load once prices are fetched
  const [hasPrefilledOnLoad, setHasPrefilledOnLoad] = useState(false);
  useEffect(() => {
    if (!hasPrefilledOnLoad && prices.XAU !== 4017.50) {
      setEntryInput(prices.XAU.toString());
      setTp1Input((prices.XAU + 3).toFixed(2));
      setTp2Input((prices.XAU + 6).toFixed(2));
      setTp3Input((prices.XAU + 10).toFixed(2));
      setSlInput((prices.XAU - 7).toFixed(2));
      setHasPrefilledOnLoad(true);
    }
  }, [prices, hasPrefilledOnLoad]);

  // Monitor prices and auto-execute TP/SL thresholds with partial close logic
  useEffect(() => {
    let databaseModified = false;

    const checkedSignals = signals.map(sig => {
      // 0. Handle Pending activation
      if (sig.status === 'PENDING') {
        const currentPrice = sig.asset === 'BTC/USDT' ? prices.BTC : prices.XAU;
        let activate = false;
        if (sig.type === 'BUY') {
          if (currentPrice <= sig.entry) activate = true;
        } else { // SELL
          if (currentPrice >= sig.entry) activate = true;
        }

        if (activate) {
          databaseModified = true;
          // Send notification: Entry triggered!
          if (tgConfig.token && tgConfig.chatId) {
            const formatVal = (v) => Math.round(v);
            const symbol = sig.asset.includes('XAU') ? 'XAUUSD' : 'BTCUSD';
            const signalEmoji = sig.type === 'BUY' ? '📈' : '📉';
            const text = `🔔 [KÍCH HOẠT TÍN HIỆU]
Symbol: ${symbol}
${signalEmoji} Signal: ${sig.type}
💠 Entry: ${formatVal(sig.entry)} (Đã khớp - Đang chạy)
==========
📬©KN Invest`;
            sendTelegramNotification(text);
          }
          return {
            ...sig,
            status: 'RUNNING'
          };
        }
        return sig;
      }

      if (sig.status !== 'RUNNING') return sig;

      const currentPrice = sig.asset === 'BTC/USDT' ? prices.BTC : prices.XAU;
      const hasTp2 = sig.tp2 > 0;
      const hasTp3 = sig.tp3 > 0;

      let tp1Hit = sig.tp1Hit || false;
      let tp2Hit = sig.tp2Hit || false;
      let tp3Hit = sig.tp3Hit || false;
      let hitSL = false;
      let hitFinalTP = false;

      // 1. Check thresholds
      if (sig.type === 'BUY') {
        if (currentPrice >= sig.tp1 && !tp1Hit) { 
          tp1Hit = true; 
          databaseModified = true; 
          notifyPartialTP(sig, 1);
        }
        if (hasTp2 && currentPrice >= sig.tp2 && !tp2Hit) { 
          tp2Hit = true; 
          databaseModified = true; 
          notifyPartialTP(sig, 2);
        }
        
        if (hasTp3) {
          if (currentPrice >= sig.tp3) { tp3Hit = true; hitFinalTP = true; }
        } else if (hasTp2) {
          if (currentPrice >= sig.tp2) { tp2Hit = true; hitFinalTP = true; }
        } else {
          if (currentPrice >= sig.tp1) { tp1Hit = true; hitFinalTP = true; }
        }

        if (currentPrice <= sig.sl) { hitSL = true; }
      } else { // SELL
        if (currentPrice <= sig.tp1 && !tp1Hit) { 
          tp1Hit = true; 
          databaseModified = true; 
          notifyPartialTP(sig, 1);
        }
        if (hasTp2 && currentPrice <= sig.tp2 && !tp2Hit) { 
          tp2Hit = true; 
          databaseModified = true; 
          notifyPartialTP(sig, 2);
        }
        
        if (hasTp3) {
          if (currentPrice <= sig.tp3) { tp3Hit = true; hitFinalTP = true; }
        } else if (hasTp2) {
          if (currentPrice <= sig.tp2) { tp2Hit = true; hitFinalTP = true; }
        } else {
          if (currentPrice <= sig.tp1) { tp1Hit = true; hitFinalTP = true; }
        }

        if (currentPrice >= sig.sl) { hitSL = true; }
      }

      // 2. Resolve partial close state
      if (hitFinalTP || hitSL) {
        databaseModified = true;
        const finalStatus = hitFinalTP ? 'TP' : 'SL';
        
        let exitPrice = sig.sl;
        if (hitFinalTP) {
          exitPrice = hasTp3 ? sig.tp3 : (hasTp2 ? sig.tp2 : sig.tp1);
        }

        const factor = sig.asset === 'BTC/USDT' ? 1.0 : 10.0;
        
        const tp1Pips = sig.type === 'BUY' ? (sig.tp1 - sig.entry) * factor : (sig.entry - sig.tp1) * factor;
        const tp2Pips = hasTp2 ? (sig.type === 'BUY' ? (sig.tp2 - sig.entry) * factor : (sig.entry - sig.tp2) * factor) : 0;
        const tp3Pips = hasTp3 ? (sig.type === 'BUY' ? (sig.tp3 - sig.entry) * factor : (sig.entry - sig.tp3) * factor) : 0;
        const slPips = sig.type === 'BUY' ? (sig.sl - sig.entry) * factor : (sig.entry - sig.sl) * factor;

        const portion1Pips = tp1Hit ? tp1Pips : slPips;
        const portion2Pips = tp2Hit ? tp2Pips : slPips;
        const portion3Pips = hitFinalTP ? (hasTp3 ? tp3Pips : (hasTp2 ? tp2Pips : tp1Pips)) : slPips;

        let finalPips = 0;
        if (hasTp3) {
          finalPips = (portion1Pips * 0.33) + (portion2Pips * 0.33) + (portion3Pips * 0.34);
        } else if (hasTp2) {
          finalPips = (portion1Pips * 0.5) + (portion2Pips * 0.5);
        } else {
          finalPips = hitFinalTP ? tp1Pips : slPips;
        }

        alert(`📣 [TÍN HIỆU ĐÓNG HOÀN TOÀN]\nTín hiệu ${sig.asset} ${sig.type} đã ĐÓNG tại ${exitPrice} (${finalStatus})!\nKết quả: ${finalPips >= 0 ? '+' : ''}${finalPips.toFixed(1)} Pips`);

        // Send closed notification to Telegram
        if (tgConfig.token && tgConfig.chatId) {
          const formatVal = (v) => Math.round(v);
          const symbol = sig.asset.includes('XAU') ? 'XAUUSD' : 'BTCUSD';
          const signalEmoji = sig.type === 'BUY' ? '📈' : '📉';
          const statusLabel = finalStatus === 'TP' ? 'TARGET HIT' : 'STOPPED OUT';
          
          const closeText = `🔔 [TÍN HIỆU ĐÓNG HOÀN TOÀN]
Symbol: ${symbol}
${signalEmoji} Signal: ${sig.type} (${statusLabel})
💠 Entry: ${formatVal(sig.entry)}
🔷 Exit Price: ${formatVal(exitPrice)}
💰 Profit: ${finalPips >= 0 ? '+' : ''}${finalPips.toFixed(1)} Pips
==========
📬©KN Invest`;
          sendTelegramNotification(closeText);
        }

        return {
          ...sig,
          status: finalStatus,
          tp1Hit: hitFinalTP || tp1Hit,
          tp2Hit: hasTp2 ? (hitFinalTP || tp2Hit) : false,
          tp3Hit: hasTp3 ? hitFinalTP : false,
          exitPrice: exitPrice,
          pips: parseFloat(finalPips.toFixed(1)),
          closedTime: new Date().toLocaleTimeString('vi-VN', { hour12: false })
        };
      }

      // If TP1 or TP2 was hit but trade is still active
      if (databaseModified) {
        return {
          ...sig,
          tp1Hit,
          tp2Hit
        };
      }

      return sig;
    });

    if (databaseModified) {
      setSignals(checkedSignals);
      localStorage.setItem('protrader_community_signals', JSON.stringify(checkedSignals));
      saveSignalsToServer(checkedSignals);
    }
  }, [prices, signals]);

  // Sync inputs on asset change
  const handleAssetSelect = (asset) => {
    setAssetInput(asset);
    const activePrice = asset === 'BTC/USDT' ? prices.BTC : prices.XAU;
    setEntryInput(activePrice.toString());
    
    if (asset === 'XAUUSD (CFD)') {
      setTp1Input((activePrice + 3).toFixed(2));
      setTp2Input((activePrice + 6).toFixed(2));
      setTp3Input((activePrice + 10).toFixed(2));
      setSlInput((activePrice - 7).toFixed(2));
    } else { // BTC/USDT
      setTp1Input((activePrice + 200).toFixed(2));
      setTp2Input((activePrice + 400).toFixed(2));
      setTp3Input((activePrice + 600).toFixed(2));
      setSlInput((activePrice - 300).toFixed(2));
    }
  };

  // Sync inputs on position type change
  const handleTypeSelect = (type) => {
    setTypeInput(type);
    const activePrice = assetInput === 'BTC/USDT' ? prices.BTC : prices.XAU;
    if (assetInput === 'XAUUSD (CFD)') {
      setTp1Input(type === 'BUY' ? (activePrice + 3).toFixed(2) : (activePrice - 3).toFixed(2));
      setTp2Input(type === 'BUY' ? (activePrice + 6).toFixed(2) : (activePrice - 6).toFixed(2));
      setTp3Input(type === 'BUY' ? (activePrice + 10).toFixed(2) : (activePrice - 10).toFixed(2));
      setSlInput(type === 'BUY' ? (activePrice - 7).toFixed(2) : (activePrice + 7).toFixed(2));
    } else {
      setTp1Input(type === 'BUY' ? (activePrice + 200).toFixed(2) : (activePrice - 200).toFixed(2));
      setTp2Input(type === 'BUY' ? (activePrice + 400).toFixed(2) : (activePrice - 400).toFixed(2));
      setTp3Input(type === 'BUY' ? (activePrice + 600).toFixed(2) : (activePrice - 600).toFixed(2));
      setSlInput(type === 'BUY' ? (activePrice - 300).toFixed(2) : (activePrice + 300).toFixed(2));
    }
  };

  // Auto-fill entry price with ticking current price
  const handlePrefillCurrentPrice = () => {
    const activePrice = assetInput === 'BTC/USDT' ? prices.BTC : prices.XAU;
    setEntryInput(activePrice.toString());
  };

  // Submit new signal
  const handleSubmitSignal = (e) => {
    e.preventDefault();

    const entry = parseFloat(entryInput);
    const tp1 = parseFloat(tp1Input);
    const tp2 = parseFloat(tp2Input) || 0;
    const tp3 = parseFloat(tp3Input) || 0;
    const sl = parseFloat(slInput);

    if (isNaN(entry) || isNaN(tp1) || isNaN(sl)) {
      alert("Vui lòng điền đúng các thông số số liệu của giá!");
      return;
    }

    // Verify logical order for active TP targets
    if (typeInput === 'BUY') {
      if (sl >= entry) {
        alert("Ràng buộc lỗi: SL phải thấp hơn Entry!");
        return;
      }
      if (tp1 <= entry) {
        alert("Ràng buộc lỗi: TP1 phải cao hơn Entry!");
        return;
      }
      if (tp2 > 0 && tp2 <= tp1) {
        alert("Ràng buộc lỗi: TP2 phải cao hơn TP1!");
        return;
      }
      if (tp3 > 0 && tp2 === 0) {
        alert("Ràng buộc lỗi: Vui lòng nhập TP2 trước khi nhập TP3!");
        return;
      }
      if (tp3 > 0 && tp3 <= tp2) {
        alert("Ràng buộc lỗi: TP3 phải cao hơn TP2!");
        return;
      }
    } else { // SELL
      if (sl <= entry) {
        alert("Ràng buộc lỗi: SL phải cao hơn Entry!");
        return;
      }
      if (tp1 >= entry) {
        alert("Ràng buộc lỗi: TP1 phải thấp hơn Entry!");
        return;
      }
      if (tp2 > 0 && tp2 >= tp1) {
        alert("Ràng buộc lỗi: TP2 phải thấp hơn TP1!");
        return;
      }
      if (tp3 > 0 && tp2 === 0) {
        alert("Ràng buộc lỗi: Vui lòng nhập TP2 trước khi nhập TP3!");
        return;
      }
      if (tp3 > 0 && tp3 >= tp2) {
        alert("Ràng buộc lỗi: TP3 phải thấp hơn TP2!");
        return;
      }
    }

    let calculatedStatus = statusInput;
    if (statusInput === 'RUNNING') {
      const currentPrice = assetInput === 'BTC/USDT' ? prices.BTC : prices.XAU;
      if (typeInput === 'BUY' && entry < currentPrice - (assetInput === 'BTC/USDT' ? 5.0 : 0.2)) {
        calculatedStatus = 'PENDING';
      } else if (typeInput === 'SELL' && entry > currentPrice + (assetInput === 'BTC/USDT' ? 5.0 : 0.2)) {
        calculatedStatus = 'PENDING';
      }
    }

    // Construct signal
    let newSignal = {
      id: `sig_${Date.now()}`,
      date: dateInput,
      time: timeInput + ':00',
      asset: assetInput,
      type: typeInput,
      entry,
      tp1,
      tp2,
      tp3,
      sl,
      status: calculatedStatus,
      tp1Hit: false,
      tp2Hit: false,
      tp3Hit: false,
      exitPrice: null,
      pips: 0,
      closedTime: null
    };

    // If archiving an old trade
    if (statusInput === 'TP' || statusInput === 'SL') {
      const exitPriceVal = parseFloat(exitPriceInput);
      if (isNaN(exitPriceVal)) {
        alert("Vui lòng điền giá đóng lệnh thực tế!");
        return;
      }

      // Calculate final Pips based on manual exit price
      const factor = assetInput === 'BTC/USDT' ? 1.0 : 10.0;
      const finalPips = typeInput === 'BUY' ? (exitPriceVal - entry) * factor : (entry - exitPriceVal) * factor;

      newSignal = {
        ...newSignal,
        exitPrice: exitPriceVal,
        pips: parseFloat(finalPips.toFixed(1)),
        tp1Hit: statusInput === 'TP',
        tp2Hit: statusInput === 'TP' && tp2 > 0,
        tp3Hit: statusInput === 'TP' && tp3 > 0,
        closedTime: timeInput + ':00'
      };
    }

    const updated = [newSignal, ...signals];
    setSignals(updated);
    localStorage.setItem('protrader_community_signals', JSON.stringify(updated));
    saveSignalsToServer(updated);
    
    // Auto-send new signals to Telegram if configured
    if ((newSignal.status === 'RUNNING' || newSignal.status === 'PENDING') && tgConfig.autoSend && tgConfig.token && tgConfig.chatId) {
      const formatVal = (v) => Math.round(v);
      const symbol = newSignal.asset.includes('XAU') ? 'XAUUSD' : 'BTCUSD';
      const signalEmoji = newSignal.type === 'BUY' ? '📈' : '📉';
      
      let signalTypeStr = newSignal.type;
      let entryZone = '';

      if (newSignal.status === 'PENDING') {
        signalTypeStr = newSignal.type === 'BUY' ? 'BUY LIMIT' : 'SELL LIMIT';
        entryZone = `${formatVal(newSignal.entry)} (Chờ kích hoạt)`;
      } else {
        if (newSignal.asset.includes('XAU')) {
          entryZone = newSignal.type === 'BUY'
            ? `${formatVal(newSignal.entry - 3)} - ${formatVal(newSignal.entry + 1)}`
            : `${formatVal(newSignal.entry - 1)} - ${formatVal(newSignal.entry + 3)}`;
        } else {
          entryZone = newSignal.type === 'BUY'
            ? `${formatVal(newSignal.entry - 150)} - ${formatVal(newSignal.entry + 50)}`
            : `${formatVal(newSignal.entry - 50)} - ${formatVal(newSignal.entry + 150)}`;
        }
      }

      let tpZone = '';
      if (newSignal.tp3 > 0) {
        tpZone = `${formatVal(newSignal.tp1)}-${formatVal(newSignal.tp3)}`;
      } else if (newSignal.tp2 > 0) {
        tpZone = `${formatVal(newSignal.tp1)}-${formatVal(newSignal.tp2)}`;
      } else {
        tpZone = `${formatVal(newSignal.tp1)}`;
      }

      const text = `Symbol: ${symbol}
${signalEmoji} Signal: ${signalTypeStr}
💠 Entry: ${entryZone}
🔷 TP: ${tpZone}
==========
📬©KN Invest`;

      sendTelegramNotification(text).then(success => {
        if (success) {
          showToast("🚀 Đã tự động gửi tín hiệu lên Telegram!");
        } else {
          showToast("❌ Lỗi gửi Telegram tự động!");
        }
      });
    }

    // Reset exit inputs
    setExitPriceInput('');
    alert(statusInput === 'RUNNING' 
      ? (newSignal.status === 'PENDING' ? "Phát tín hiệu chờ kích hoạt (Limit) thành công!" : "Phát tín hiệu mới thành công!")
      : "Lưu trữ lịch sử lệnh cũ thành công!");
  };

  // Close signal early manually at current price
  const handleCloseEarly = (sigId) => {
    const updated = signals.map(sig => {
      if (sig.id !== sigId || sig.status !== 'RUNNING') return sig;

      const currentPrice = sig.asset === 'BTC/USDT' ? prices.BTC : prices.XAU;
      const factor = sig.asset === 'BTC/USDT' ? 1.0 : 10.0;
      const hasTp2 = sig.tp2 > 0;
      const hasTp3 = sig.tp3 > 0;

      const tp1Pips = sig.type === 'BUY' ? (sig.tp1 - sig.entry) * factor : (sig.entry - sig.tp1) * factor;
      const tp2Pips = hasTp2 ? (sig.type === 'BUY' ? (sig.tp2 - sig.entry) * factor : (sig.entry - sig.tp2) * factor) : 0;
      const currentPips = sig.type === 'BUY' ? (currentPrice - sig.entry) * factor : (sig.entry - currentPrice) * factor;

      let finalPips = 0;
      if (hasTp3) {
        const portion1Pips = sig.tp1Hit ? tp1Pips : currentPips;
        const portion2Pips = sig.tp2Hit ? tp2Pips : currentPips;
        const portion3Pips = currentPips;
        finalPips = (portion1Pips * 0.33) + (portion2Pips * 0.33) + (portion3Pips * 0.34);
      } else if (hasTp2) {
        const portion1Pips = sig.tp1Hit ? tp1Pips : currentPips;
        const portion2Pips = currentPips;
        finalPips = (portion1Pips * 0.5) + (portion2Pips * 0.5);
      } else {
        finalPips = currentPips;
      }

      // Send manual close notification to Telegram
      if (tgConfig.token && tgConfig.chatId) {
        const formatVal = (v) => Math.round(v);
        const symbol = sig.asset.includes('XAU') ? 'XAUUSD' : 'BTCUSD';
        const signalEmoji = sig.type === 'BUY' ? '📈' : '📉';
        
        const closeText = `🔔 [TÍN HIỆU ĐÓNG HOÀN TOÀN]
Symbol: ${symbol}
${signalEmoji} Signal: ${sig.type} (CLOSED EARLY)
💠 Entry: ${formatVal(sig.entry)}
🔷 Exit Price: ${formatVal(currentPrice)}
💰 Profit: ${finalPips >= 0 ? '+' : ''}${finalPips.toFixed(1)} Pips
==========
📬©KN Invest`;
        sendTelegramNotification(closeText);
      }

      return {
        ...sig,
        status: 'COMPLETED',
        exitPrice: currentPrice,
        pips: parseFloat(finalPips.toFixed(1)),
        closedTime: new Date().toLocaleTimeString('vi-VN', { hour12: false })
      };
    });

    setSignals(updated);
    localStorage.setItem('protrader_community_signals', JSON.stringify(updated));
    saveSignalsToServer(updated);
  };

  // Delete signal
  const handleDeleteSignal = (sigId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tín hiệu này?")) {
      const sigToDelete = signals.find(sig => sig.id === sigId);
      if (sigToDelete && sigToDelete.status === 'RUNNING') {
        // Send cancellation notification to Telegram
        if (tgConfig.token && tgConfig.chatId) {
          const formatVal = (v) => Math.round(v);
          const symbol = sigToDelete.asset.includes('XAU') ? 'XAUUSD' : 'BTCUSD';
          const signalEmoji = sigToDelete.type === 'BUY' ? '📈' : '📉';
          
          const text = `🔔 [HỦY TÍN HIỆU]
Symbol: ${symbol}
${signalEmoji} Signal: ${sigToDelete.type} (CANCELLED)
💠 Entry: ${formatVal(sigToDelete.entry)}
Lệnh đã bị HỦY. Vui lòng chờ tín hiệu sau!
==========
📬©KN Invest`;
          sendTelegramNotification(text);
        }
      }

      const updated = signals.filter(sig => sig.id !== sigId);
      setSignals(updated);
      localStorage.setItem('protrader_community_signals', JSON.stringify(updated));
      saveSignalsToServer(updated);
    }
  };

  // Calculate dynamic stats
  const getSummaryStats = () => {
    const total = signals.length;
    const completed = signals.filter(s => s.status === 'TP' || s.status === 'SL' || s.status === 'COMPLETED');
    const winTrades = completed.filter(s => s.pips > 0);
    const winRate = completed.length > 0 ? (winTrades.length / completed.length) * 100 : 0;
    
    const totalPips = signals.reduce((sum, sig) => {
      if (sig.status !== 'RUNNING') return sum + sig.pips;

      const currentPrice = sig.asset === 'BTC/USDT' ? prices.BTC : prices.XAU;
      const factor = sig.asset === 'BTC/USDT' ? 1.0 : 10.0;
      const hasTp2 = sig.tp2 > 0;
      const hasTp3 = sig.tp3 > 0;
      
      const tp1Pips = sig.type === 'BUY' ? (sig.tp1 - sig.entry) * factor : (sig.entry - sig.tp1) * factor;
      const tp2Pips = hasTp2 ? (sig.type === 'BUY' ? (sig.tp2 - sig.entry) * factor : (sig.entry - sig.tp2) * factor) : 0;
      const currentPips = sig.type === 'BUY' ? (currentPrice - sig.entry) * factor : (sig.entry - currentPrice) * factor;

      let floatingPips = 0;
      if (hasTp3) {
        const portion1Pips = sig.tp1Hit ? tp1Pips : currentPips;
        const portion2Pips = sig.tp2Hit ? tp2Pips : currentPips;
        const portion3Pips = currentPips;
        floatingPips = (portion1Pips * 0.33) + (portion2Pips * 0.33) + (portion3Pips * 0.34);
      } else if (hasTp2) {
        const portion1Pips = sig.tp1Hit ? tp1Pips : currentPips;
        const portion2Pips = currentPips;
        floatingPips = (portion1Pips * 0.5) + (portion2Pips * 0.5);
      } else {
        floatingPips = currentPips;
      }
      return sum + floatingPips;
    }, 0);

    const activeCount = signals.filter(s => s.status === 'RUNNING').length;

    return {
      total,
      winRate,
      totalPips: parseFloat(totalPips.toFixed(1)),
      activeCount
    };
  };

  const summary = getSummaryStats();
  const isPipsPositive = summary.totalPips >= 0;

  // Filter signals based on search query
  const filteredSignals = signals.filter(sig => 
    sig.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sig.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sig.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-24">
      {/* View Header */}
      <div className="flex justify-between align-center">
        <div>
          <h1 className="page-title">Community Signals Hub</h1>
          <p className="page-description">Nhập tín hiệu chốt lời từng phần (TP1-TP3), ngày giờ tùy chỉnh và lưu trữ lịch sử lệnh.</p>
        </div>

        {/* Live ticking price widgets */}
        <div className="flex align-center gap-16">
          <div className="card flex align-center gap-12" style={{ padding: '8px 16px', borderRadius: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', className: 'pulse-glow' }} />
            <div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>XAUUSD (CFD)</div>
              <div className="text-mono" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-success-text)' }}>
                ${prices.XAU.toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="card flex align-center gap-12" style={{ padding: '8px 16px', borderRadius: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', className: 'pulse-glow' }} />
            <div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>BTC/USDT</div>
              <div className="text-mono" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-success-text)' }}>
                ${prices.BTC.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Telegram Bot Configuration Panel */}
      <div className="card" style={{ padding: '16px 20px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        <div 
          className="flex justify-between align-center cursor-pointer" 
          onClick={() => setShowTgSettings(!showTgSettings)}
          style={{ userSelect: 'none' }}
        >
          <div className="flex align-center gap-12">
            <span style={{ fontSize: '20px' }}>🤖</span>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.02em' }}>CẤU HÌNH TELEGRAM BOT (GỬI TỰ ĐỘNG)</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {tgConfig.token && tgConfig.chatId 
                  ? `Đang hoạt động: Kênh ${tgConfig.chatId}` 
                  : "Chưa cấu hình. Nhấp để thiết lập gửi tín hiệu tự động trực tiếp vào nhóm/kênh của bạn."}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary text-mono" 
            style={{ height: '30px', padding: '0 12px', fontSize: '11px', fontWeight: '600' }}
          >
            {showTgSettings ? 'THU GỌN' : 'THIẾT LẬP'}
          </button>
        </div>

        {showTgSettings && (
          <div className="flex-col gap-16" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="grid-4" style={{ gap: '16px' }}>
              <div className="filter-item">
                <span className="filter-label">TELEGRAM BOT TOKEN</span>
                <input 
                  type="text" 
                  className="input-field text-mono" 
                  style={{ height: '38px', fontSize: '12px', borderColor: 'rgba(255,255,255,0.08)' }}
                  placeholder="Ví dụ: 712345678:AAH..."
                  value={tgConfig.token}
                  onChange={(e) => setTgConfig({ ...tgConfig, token: e.target.value })}
                />
              </div>
              <div className="filter-item">
                <span className="filter-label">CHAT ID TÍN HIỆU (SIGNALS)</span>
                <input 
                  type="text" 
                  className="input-field text-mono" 
                  style={{ height: '38px', fontSize: '12px', borderColor: 'rgba(255,255,255,0.08)' }}
                  placeholder="Kênh tín hiệu (e.g. @kn_channel)"
                  value={tgConfig.chatId}
                  onChange={(e) => setTgConfig({ ...tgConfig, chatId: e.target.value })}
                />
              </div>
              <div className="filter-item">
                <span className="filter-label">CHAT ID BÁO CÁO BOT (BOT REPORT)</span>
                <input 
                  type="text" 
                  className="input-field text-mono" 
                  style={{ height: '38px', fontSize: '12px', borderColor: 'rgba(255,255,255,0.08)' }}
                  placeholder="Kênh báo cáo bot (e.g. @kn_bot_report)"
                  value={tgConfig.botChatId || ''}
                  onChange={(e) => setTgConfig({ ...tgConfig, botChatId: e.target.value })}
                />
              </div>
              <div className="filter-item">
                <span className="filter-label">TỰ ĐỘNG GỬI KHI PHÁT LỆNH</span>
                <div style={{ display: 'flex', alignItems: 'center', height: '38px', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="autoSendCheckbox"
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                    checked={tgConfig.autoSend}
                    onChange={(e) => setTgConfig({ ...tgConfig, autoSend: e.target.checked })}
                  />
                  <label htmlFor="autoSendCheckbox" style={{ fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    Đẩy lệnh mới trực tiếp lên Telegram
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between align-center" style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              <div className="flex gap-12">
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ height: '34px', padding: '0 16px', fontSize: '12px', fontWeight: '700' }}
                  onClick={async () => {
                    localStorage.setItem('protrader_telegram_config', JSON.stringify(tgConfig));
                    try {
                      await fetch(`${API_BASE_URL}/api/telegram-config`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(tgConfig)
                      });
                      showToast("💾 Đã lưu cấu hình Telegram Bot!");
                    } catch (err) {
                      alert("⚠️ Không thể lưu cấu hình lên máy chủ trung tâm!");
                    }
                    setShowTgSettings(false);
                  }}
                >
                  Lưu cấu hình
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ height: '34px', padding: '0 16px', fontSize: '12px', fontWeight: '700', color: 'var(--color-accent)', borderColor: 'rgba(96, 165, 250, 0.2)' }}
                  onClick={handleTestTelegram}
                >
                  Gửi thử tin nhắn test
                </button>
              </div>

              <div className="flex align-center gap-12">
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>BÁO CÁO NHANH:</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ height: '32px', padding: '0 12px', fontSize: '11px', fontWeight: '600' }}
                  onClick={() => handleSendStatsTelegram('day')}
                >
                  📊 Hôm nay
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ height: '32px', padding: '0 12px', fontSize: '11px', fontWeight: '600' }}
                  onClick={() => handleSendStatsTelegram('week')}
                >
                  📊 Tuần này
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ height: '32px', padding: '0 12px', fontSize: '11px', fontWeight: '600' }}
                  onClick={() => handleSendStatsTelegram('month')}
                >
                  📊 Tháng này
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Stats summary row */}
      <div className="grid-4">
        {/* Total Signals */}
        <div className="card stat-card">
          <div className="flex-col">
            <div className="stat-label">Tổng Tín Hiệu Đã Phát</div>
            <div className="stat-value">{summary.total}</div>
            <div className="stat-sub text-success">Lưu trữ trên Database</div>
          </div>
          <div className="stat-icon-wrapper">
            <DashboardIcon size={18} />
          </div>
        </div>

        {/* Win Rate */}
        <div className="card stat-card">
          <div className="flex-col" style={{ width: 'calc(100% - 50px)' }}>
            <div className="stat-label">Tỉ Lệ Thắng (Win Rate)</div>
            <div className="stat-value">{summary.winRate.toFixed(1)}%</div>
            <div style={{ marginTop: '10px', width: '100%' }}>
              <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${summary.winRate}%`, height: '100%', backgroundColor: 'var(--color-success)', borderRadius: '2px' }} />
              </div>
            </div>
          </div>
          <div className="stat-icon-wrapper">
            <TrophyIcon size={18} />
          </div>
        </div>

        {/* Net Profit in PIPs */}
        <div className="card stat-card">
          <div className="flex-col">
            <div className="stat-label">Tổng Lợi Nhuận (Pip Stats)</div>
            <div className={`stat-value ${isPipsPositive ? 'text-success' : 'text-danger'}`}>
              {isPipsPositive ? '+' : ''}{summary.totalPips.toLocaleString()} Pips
            </div>
            <div className={`stat-sub ${isPipsPositive ? 'text-success' : 'text-danger'}`}>
              Kết toán từng phần (Partials)
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: isPipsPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isPipsPositive ? 'var(--color-success)' : 'var(--color-danger)' }}>
            <WalletIcon size={18} />
          </div>
        </div>

        {/* Active Signals Count */}
        <div className="card stat-card">
          <div className="flex-col">
            <div className="stat-label">Tín Hiệu Đang Chạy</div>
            <div className="stat-value text-accent">{summary.activeCount}</div>
            <div className="stat-sub text-accent">Auto-checking TP1 - TP3...</div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-accent)' }}>
            <TrendUpIcon size={18} />
          </div>
        </div>
      </div>

      {/* Advanced Manual Input Form Section */}
      {userRole === 'admin' ? (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LightningIcon size={18} style={{ color: 'var(--color-accent)' }} />
            TẠO & LƯU TRỮ TÍN HIỆU CỘNG ĐỒNG
          </h3>

          <form onSubmit={handleSubmitSignal} className="flex-col gap-16">
          <div className="grid-5" style={{ gap: '16px', alignItems: 'flex-end' }}>
            {/* Asset Selection */}
            <div className="filter-item">
              <span className="filter-label">CẶP TIỀN</span>
              <div className="filter-pills" style={{ height: '40px', display: 'flex', width: '100%' }}>
                {['XAUUSD (CFD)', 'BTC/USDT'].map((asset) => (
                  <button
                    key={asset}
                    type="button"
                    className={`filter-pill ${assetInput === asset ? 'active' : ''}`}
                    onClick={() => handleAssetSelect(asset)}
                    style={{ flex: 1, padding: 0 }}
                  >
                    {asset.includes('XAU') ? 'XAUUSD' : 'BTCUSD'}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Select */}
            <div className="filter-item">
              <span className="filter-label">VỊ THẾ</span>
              <div className="filter-pills" style={{ height: '40px', display: 'flex', width: '100%' }}>
                <button
                  type="button"
                  className={`filter-pill ${typeInput === 'BUY' ? 'active' : ''}`}
                  onClick={() => handleTypeSelect('BUY')}
                  style={{
                    flex: 1,
                    padding: 0,
                    backgroundColor: typeInput === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : '',
                    color: typeInput === 'BUY' ? 'var(--color-success-text)' : '',
                    borderColor: typeInput === 'BUY' ? 'var(--color-success)' : ''
                  }}
                >
                  BUY LONG
                </button>
                <button
                  type="button"
                  className={`filter-pill ${typeInput === 'SELL' ? 'active' : ''}`}
                  onClick={() => handleTypeSelect('SELL')}
                  style={{
                    flex: 1,
                    padding: 0,
                    backgroundColor: typeInput === 'SELL' ? 'rgba(239, 68, 68, 0.15)' : '',
                    color: typeInput === 'SELL' ? 'var(--color-danger-text)' : '',
                    borderColor: typeInput === 'SELL' ? 'var(--color-danger)' : ''
                  }}
                >
                  SELL SHORT
                </button>
              </div>
            </div>

            {/* Entry Price */}
            <div className="filter-item">
              <div className="flex justify-between" style={{ width: '100%' }}>
                <span className="filter-label">GIÁ ENTRY</span>
                <button
                  type="button"
                  onClick={handlePrefillCurrentPrice}
                  style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '9px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                >
                  LẤY GIÁ HIỆN TẠI
                </button>
              </div>
              <input
                type="number"
                step="any"
                className="input-field text-mono"
                style={{ height: '40px', fontWeight: '600' }}
                value={entryInput}
                onChange={(e) => setEntryInput(e.target.value)}
              />
            </div>

            {/* Date Selection */}
            <div className="filter-item">
              <span className="filter-label">NGÀY PHÁT LỆNH</span>
              <input
                type="date"
                className="input-field"
                style={{ height: '40px', fontWeight: '500' }}
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
              />
            </div>

            {/* Time Selection */}
            <div className="filter-item">
              <span className="filter-label">GIỜ PHÁT LỆNH</span>
              <input
                type="time"
                className="input-field"
                style={{ height: '40px', fontWeight: '500' }}
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-5" style={{ gap: '16px', alignItems: 'flex-end' }}>
            {/* TP1 */}
            <div className="filter-item">
              <span className="filter-label text-success">CHỐT LỜI TP1 (Bắt buộc)</span>
              <input
                type="number"
                step="any"
                className="input-field text-mono"
                style={{ height: '40px', borderColor: 'rgba(16, 185, 129, 0.2)', fontWeight: '600', color: 'var(--color-success-text)' }}
                value={tp1Input}
                onChange={(e) => setTp1Input(e.target.value)}
              />
            </div>

            {/* TP2 */}
            <div className="filter-item">
              <span className="filter-label text-success">CHỐT LỜI TP2 (0 = Bỏ qua)</span>
              <input
                type="number"
                step="any"
                className="input-field text-mono"
                style={{ height: '40px', borderColor: 'rgba(16, 185, 129, 0.2)', fontWeight: '600', color: 'var(--color-success-text)' }}
                value={tp2Input}
                onChange={(e) => setTp2Input(e.target.value)}
              />
            </div>

            {/* TP3 */}
            <div className="filter-item">
              <span className="filter-label text-success">CHỐT LỜI TP3 (0 = Bỏ qua)</span>
              <input
                type="number"
                step="any"
                className="input-field text-mono"
                style={{ height: '40px', borderColor: 'rgba(16, 185, 129, 0.2)', fontWeight: '600', color: 'var(--color-success-text)' }}
                value={tp3Input}
                onChange={(e) => setTp3Input(e.target.value)}
              />
            </div>

            {/* Stop Loss */}
            <div className="filter-item">
              <span className="filter-label text-danger">CẶP CẮT LỖ (SL)</span>
              <input
                type="number"
                step="any"
                className="input-field text-mono"
                style={{ height: '40px', borderColor: 'rgba(239, 68, 68, 0.2)', fontWeight: '600', color: 'var(--color-danger-text)' }}
                value={slInput}
                onChange={(e) => setSlInput(e.target.value)}
              />
            </div>

            {/* Status Select for Archiving */}
            <div className="filter-item">
              <span className="filter-label">TRẠNG THÁI LỆNH</span>
              <select
                className="input-field select-field"
                style={{ height: '40px', fontWeight: '600' }}
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
              >
                <option value="RUNNING">Đang chạy (RUNNING)</option>
                <option value="TP">Chốt lời cũ (Archived TP)</option>
                <option value="SL">Cắt lỗ cũ (Archived SL)</option>
              </select>
            </div>
          </div>

          {/* Conditional Exit Price Input if TP or SL selected */}
          {(statusInput === 'TP' || statusInput === 'SL') && (
            <div className="filter-item" style={{ width: '250px', alignSelf: 'flex-start', marginTop: '4px' }}>
              <span className="filter-label text-accent">GIÁ ĐÓNG LỆNH THỰC TẾ (EXIT PRICE)</span>
              <input
                type="number"
                step="any"
                className="input-field text-mono"
                style={{ height: '40px', borderColor: 'rgba(96, 165, 250, 0.3)', fontWeight: '700', color: 'var(--color-accent)' }}
                placeholder="Nhập giá đóng lệnh..."
                value={exitPriceInput}
                onChange={(e) => setExitPriceInput(e.target.value)}
              />
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              height: '42px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: 'var(--shadow-glow)',
              width: '220px',
              alignSelf: 'flex-start',
              marginTop: '8px'
            }}
          >
            <PlusIcon size={14} />
            <span>{statusInput === 'RUNNING' ? 'Phát Tín Hiệu' : 'Lưu Trữ Lịch Sử'}</span>
          </button>
        </form>
      </div>
      ) : (
        <div className="card" style={{ padding: '24px', textAlign: 'center', backgroundColor: 'rgba(59, 130, 246, 0.02)', borderStyle: 'dashed' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            🔒 Đăng nhập với quyền <strong>Admin</strong> để tạo mới hoặc thay đổi tín hiệu.
          </p>
        </div>
      )}

      {/* Signals Management Dashboard List */}
      <div className="card" style={{ padding: '20px 0 0 0' }}>
        <div className="flex justify-between align-center" style={{ padding: '0 20px 16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Danh Sách Tín Hiệu Cộng Đồng</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Quản lý chốt lời từng phần (TP1-TP3), kiểm tra giá real-time và Pips thả nổi.
            </p>
          </div>
          {userRole === 'admin' && (
            <button 
              className="btn btn-secondary"
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn khôi phục danh sách tín hiệu về mặc định?")) {
                  setSignals(DEFAULT_SIGNALS);
                  localStorage.setItem('protrader_community_signals', JSON.stringify(DEFAULT_SIGNALS));
                }
              }}
            >
              Khôi phục mặc định
            </button>
          )}
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>CẶP TIỀN</th>
                <th>VỊ THẾ</th>
                <th>ENTRY</th>
                <th>TARGETS</th>
                <th>CURRENT / EXIT PRICE</th>
                <th>PROFIT (PIPS)</th>
                <th>TRẠNG THÁI</th>
                {userRole === 'admin' && <th style={{ textAlign: 'right' }}>THAO TÁC</th>}
              </tr>
            </thead>
            <tbody>
              {filteredSignals.length > 0 ? (
                filteredSignals.map((sig) => {
                  const isRunning = sig.status === 'RUNNING';
                  const currentPrice = sig.asset === 'BTC/USDT' ? prices.BTC : prices.XAU;
                  const displayPrice = isRunning ? currentPrice : sig.exitPrice;
                  const hasTp2 = sig.tp2 > 0;
                  const hasTp3 = sig.tp3 > 0;

                  // 1. Calculate live float PNL based on active TP levels
                  let livePips = sig.pips;
                  if (isRunning) {
                    const factor = sig.asset === 'BTC/USDT' ? 1.0 : 10.0;
                    
                    const tp1Pips = sig.type === 'BUY' ? (sig.tp1 - sig.entry) * factor : (sig.entry - sig.tp1) * factor;
                    const tp2Pips = hasTp2 ? (sig.type === 'BUY' ? (sig.tp2 - sig.entry) * factor : (sig.entry - sig.tp2) * factor) : 0;
                    const currentPips = sig.type === 'BUY' ? (currentPrice - sig.entry) * factor : (sig.entry - currentPrice) * factor;

                    if (hasTp3) {
                      const portion1Pips = sig.tp1Hit ? tp1Pips : currentPips;
                      const portion2Pips = sig.tp2Hit ? tp2Pips : currentPips;
                      const portion3Pips = currentPips;
                      livePips = (portion1Pips * 0.33) + (portion2Pips * 0.33) + (portion3Pips * 0.34);
                    } else if (hasTp2) {
                      const portion1Pips = sig.tp1Hit ? tp1Pips : currentPips;
                      const portion2Pips = currentPips;
                      livePips = (portion1Pips * 0.5) + (portion2Pips * 0.5);
                    } else {
                      livePips = currentPips;
                    }
                  }
                  
                  const formattedPips = parseFloat(livePips.toFixed(1));
                  const isPositive = formattedPips >= 0;

                  return (
                    <tr key={sig.id}>
                      {/* Date & Time */}
                      <td className="text-mono" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        <div>{sig.date}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sig.time}</div>
                      </td>
                      
                      {/* Asset Symbol */}
                      <td style={{ fontWeight: '600' }}>
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          display: 'inline-block', 
                          marginRight: '8px',
                          backgroundColor: sig.asset === 'BTC/USDT' ? 'var(--color-accent)' : '#fbbf24'
                        }} />
                        {sig.asset}
                      </td>

                      {/* Position Type */}
                      <td>
                        <span 
                          className="badge" 
                          style={{
                            backgroundColor: sig.type === 'BUY' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                            color: sig.type === 'BUY' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                        >
                          {sig.type === 'BUY' ? 'BUY LONG' : 'SELL SHORT'}
                        </span>
                      </td>

                      {/* Entry Price */}
                      <td className="text-mono" style={{ fontWeight: '500' }}>
                        ${sig.entry.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Targets TP1 - TP3 & SL */}
                      <td>
                        <div className="flex-col gap-4" style={{ fontSize: '11px' }}>
                          <span className="text-success" style={{ fontWeight: '600' }}>
                            {hasTp2 ? 'TP1:' : 'TP:'} ${sig.tp1.toLocaleString(undefined, { minimumFractionDigits: 2 })} {sig.tp1Hit && <span style={{ color: 'var(--color-success)' }}>✓</span>}
                          </span>
                          {hasTp2 && (
                            <span className="text-success" style={{ fontWeight: '600' }}>
                              TP2: ${sig.tp2.toLocaleString(undefined, { minimumFractionDigits: 2 })} {sig.tp2Hit && <span style={{ color: 'var(--color-success)' }}>✓</span>}
                            </span>
                          )}
                          {hasTp3 && (
                            <span className="text-success" style={{ fontWeight: '600' }}>
                              TP3: ${sig.tp3.toLocaleString(undefined, { minimumFractionDigits: 2 })} {sig.tp3Hit && <span style={{ color: 'var(--color-success)' }}>✓</span>}
                            </span>
                          )}
                          <span className="text-danger" style={{ fontWeight: '600', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2px', marginTop: '2px' }}>
                            SL: ${sig.sl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>

                      {/* Current / Exit Price */}
                      <td className={`text-mono ${isRunning ? 'text-accent font-semibold pulse-price' : ''}`}>
                        ${displayPrice ? displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* Profit in Pips */}
                      <td className={`text-mono font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {isPositive ? '+' : ''}{formattedPips.toLocaleString()} pips
                      </td>

                      {/* Status Badge */}
                      <td>
                        {sig.status === 'PENDING' ? (
                          <span className="badge badge-pending">PENDING</span>
                        ) : isRunning ? (
                          <div className="flex-col align-start gap-4">
                            <span className="badge badge-running">RUNNING</span>
                            {sig.tp2Hit ? (
                              <span style={{ fontSize: '9px', color: 'var(--color-success)' }}>TP2 hit (+2/3)</span>
                            ) : sig.tp1Hit ? (
                              <span style={{ fontSize: '9px', color: 'var(--color-success)' }}>TP1 hit (+1/3)</span>
                            ) : null}
                          </div>
                        ) : sig.status === 'TP' ? (
                          <span className="badge badge-win" style={{ boxShadow: '0 0 10px rgba(16, 185, 129, 0.15)' }}>TARGET HIT</span>
                        ) : sig.status === 'SL' ? (
                          <div className="flex-col align-start gap-4">
                            <span className="badge badge-loss">STOPPED OUT</span>
                            {sig.tp2Hit ? (
                              <span style={{ fontSize: '9px', color: 'var(--color-success)' }}>Hit TP1, TP2</span>
                            ) : sig.tp1Hit ? (
                              <span style={{ fontSize: '9px', color: 'var(--color-success)' }}>Hit TP1</span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>CLOSED</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      {userRole === 'admin' && (
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex gap-8 justify-end">
                            <button
                              onClick={() => handleExportTelegram(sig)}
                              className="btn btn-secondary"
                              style={{ 
                                height: '28px', 
                                padding: '0 10px', 
                                fontSize: '11px', 
                                fontWeight: '500', 
                                color: 'var(--color-accent)', 
                                borderColor: 'rgba(96, 165, 250, 0.15)' 
                              }}
                            >
                              Telegram
                            </button>
                            {isRunning && (
                              <button
                                onClick={() => handleCloseEarly(sig.id)}
                                className="btn btn-secondary"
                                style={{ height: '28px', padding: '0 10px', fontSize: '11px', fontWeight: '500' }}
                              >
                                Đóng sớm
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteSignal(sig.id)}
                              className="btn btn-secondary"
                              style={{ 
                                height: '28px', 
                                padding: '0 10px', 
                                fontSize: '11px', 
                                fontWeight: '500', 
                                color: 'var(--color-danger)', 
                                borderColor: 'rgba(239, 68, 68, 0.1)' 
                              }}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={userRole === 'admin' ? 9 : 8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Không tìm thấy tín hiệu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Floating Toast Alert */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          color: 'var(--text-primary)',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), var(--shadow-glow)',
          border: '1px solid var(--color-accent)',
          zIndex: 9999,
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeInUp 0.2s ease-out'
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
};
