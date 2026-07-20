import React, { useState } from 'react';
import { 
  ExportIcon, 
  LightningIcon, 
  FilterIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  TrendUpIcon
} from './Icons';

export const HistoryView = ({ searchTerm, activeBotId, runningBots, mt5HistoryDeals }) => {
  // Filters States
  const [timeRange, setTimeRange] = useState('30 ngày gần nhất');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, BOT, SIGNAL
  const [pairFilter, setPairFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL'); // ALL, Long, Short

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Dynamic filter criteria state
  const [activeFilters, setActiveFilters] = useState({
    type: 'ALL',
    pair: '',
    position: 'ALL'
  });

  const handleApplyFilter = () => {
    setActiveFilters({
      type: typeFilter,
      pair: pairFilter,
      position: positionFilter
    });
    setCurrentPage(1);
  };

  // Generate dynamic date strings relative to current time so date filters work perfectly
  const now = new Date();
  
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
  };

  // Mock History Data for Virtual Bots with dynamic dates
  const rawHistoryData = [
    // Today
    { time: formatDate(new Date(now.getTime() - 1000 * 60 * 45)), pair: 'BTC/USDT', type: 'BOT #042', typeCat: 'BOT', botId: '1', position: 'Long', amount: 2450.00, pnl: 412.50, roi: 16.84 },
    { time: formatDate(new Date(now.getTime() - 1000 * 60 * 180)), pair: 'ETH/USDT', type: 'SIGNAL VIP', typeCat: 'SIGNAL', botId: 'signal', position: 'Short', amount: 5000.00, pnl: -125.20, roi: -2.50 },
    // Yesterday (Within 7 days)
    { time: formatDate(new Date(now.getTime() - 1000 * 60 * 60 * 25)), pair: 'SOL/USDT', type: 'BOT #042', typeCat: 'BOT', botId: '3', position: 'Long', amount: 1200.00, pnl: 84.00, roi: 7.00 },
    { time: formatDate(new Date(now.getTime() - 1000 * 60 * 60 * 48)), pair: 'BTC/USDT', type: 'BOT #018', typeCat: 'BOT', botId: '1', position: 'Long', amount: 10000.00, pnl: 1560.20, roi: 15.60 },
    { time: formatDate(new Date(now.getTime() - 1000 * 60 * 60 * 96)), pair: 'ETH/USDT', type: 'BOT #018', typeCat: 'BOT', botId: '2', position: 'Long', amount: 3500.00, pnl: 280.00, roi: 8.00 },
    // Last week (Within 30 days)
    { time: formatDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 9)), pair: 'SOL/USDT', type: 'SIGNAL VIP', typeCat: 'SIGNAL', botId: 'signal', position: 'Short', amount: 2500.00, pnl: -75.00, roi: -3.00 },
    { time: formatDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14)), pair: 'LINK/USDT', type: 'BOT #007', typeCat: 'BOT', botId: '2', position: 'Long', amount: 1500.00, pnl: 105.00, roi: 7.00 },
    { time: formatDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 22)), pair: 'ADA/USDT', type: 'SIGNAL VIP', typeCat: 'SIGNAL', botId: 'signal', position: 'Long', amount: 800.00, pnl: 48.00, roi: 6.00 },
    { time: formatDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 26)), pair: 'BTC/USDT', type: 'BOT #042', typeCat: 'BOT', botId: '3', position: 'Short', amount: 4000.00, pnl: -160.00, roi: -4.00 },
    { time: formatDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 28)), pair: 'ETH/USDT', type: 'BOT #007', typeCat: 'BOT', botId: '1', position: 'Long', amount: 6000.00, pnl: 720.00, roi: 12.00 }
  ];

  // Helper to parse dates in "17 Jul 2026 10:15:30" format
  const parseDateStr = (dateStr) => {
    const parts = dateStr.split(' ');
    if (parts.length < 4) return new Date();
    const day = parseInt(parts[0], 10);
    const months = { 'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11 };
    const month = months[parts[1]] || 0;
    const year = parseInt(parts[2], 10);
    const timeParts = parts[3].split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const seconds = parseInt(timeParts[2], 10);
    return new Date(year, month, day, hours, minutes, seconds);
  };

  // Convert MT5 bridge deals to local History format
  const selectedBot = activeBotId === 'all' ? null : runningBots.find(b => b.id === activeBotId);

  const mappedMt5Deals = mt5HistoryDeals.map((deal, idx) => {
    // Estimate size and ROI for uniform UI representation
    const dealVolume = deal.volume || 0.1;
    const dealPrice = deal.price || 1.0;
    const dealAmount = dealPrice * dealVolume * 100;
    const dealRoi = (deal.profit / (dealPrice * dealVolume * 10)) * 100;

    return {
      time: deal.time,
      pair: deal.symbol,
      type: 'MT5 Sync',
      typeCat: 'BOT',
      botId: selectedBot ? selectedBot.id : 'mt5',
      position: deal.type, // 'Long' or 'Short'
      amount: dealAmount,
      pnl: deal.profit,
      roi: dealRoi
    };
  });

  // Assemble the unified database list based on activeBotId
  let unifiedDeals = [];
  if (activeBotId === 'all') {
    // Show all virtual bot deals + any fetched MT5 deals
    unifiedDeals = [...rawHistoryData, ...mappedMt5Deals];
  } else if (selectedBot && selectedBot.isMt5) {
    // Show only MT5 deals
    unifiedDeals = mappedMt5Deals;
  } else {
    // Show only the selected virtual bot's deals
    unifiedDeals = rawHistoryData.filter(deal => deal.botId === activeBotId);
  }

  // Sort unified deals by time descending
  unifiedDeals.sort((a, b) => parseDateStr(b.time) - parseDateStr(a.time));

  // Filter history data using active search term, selected timeframe, and advanced filters
  const filteredData = unifiedDeals.filter(item => {
    // 1. Timeframe Filter
    const itemDate = parseDateStr(item.time);
    const diffTime = Math.abs(now - itemDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let matchesTime = true;
    if (timeRange === 'Hôm nay') {
      matchesTime = itemDate.toDateString() === now.toDateString();
    } else if (timeRange === '7 ngày gần nhất') {
      matchesTime = diffDays <= 7;
    } else if (timeRange === '30 ngày gần nhất') {
      matchesTime = diffDays <= 30;
    }

    // 2. Header Search
    const matchesHeaderSearch = searchTerm === '' || 
      item.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase());

    // 3. Type Filter Pill
    const matchesType = activeFilters.type === 'ALL' || item.typeCat === activeFilters.type;

    // 4. Pair Filter Input
    const matchesPair = activeFilters.pair === '' || 
      item.pair.toLowerCase().includes(activeFilters.pair.toLowerCase());

    // 5. Position Filter Dropdown
    const matchesPosition = activeFilters.position === 'ALL' || item.position === activeFilters.position;

    return matchesTime && matchesHeaderSearch && matchesType && matchesPair && matchesPosition;
  });

  // Calculate dynamic metrics on the filtered dataset
  const getDynamicFooterStats = () => {
    const totalTrades = filteredData.length;
    if (totalTrades === 0) {
      return { totalPnl: 0, winRate: 0, closedTrades: 0, avgRoi: 0 };
    }

    const totalPnl = filteredData.reduce((sum, item) => sum + item.pnl, 0);
    const winTrades = filteredData.filter(item => item.pnl > 0).length;
    const winRate = (winTrades / totalTrades) * 100;
    const avgRoi = filteredData.reduce((sum, item) => sum + item.roi, 0) / totalTrades;

    return {
      totalPnl,
      winRate,
      closedTrades: totalTrades,
      avgRoi
    };
  };

  const footerStats = getDynamicFooterStats();
  const isPnlPositive = footerStats.totalPnl >= 0;

  // Simple Pagination config (e.g. 5 items per page)
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="flex flex-col gap-24">
      {/* View Header */}
      <div className="flex justify-between align-center">
        <div>
          <h1 className="page-title">
            Lịch Sử Giao Dịch {selectedBot ? `(${selectedBot.name})` : '(Tất cả)'}
          </h1>
          <p className="page-description">Theo dõi và phân tích hiệu suất các lệnh đã đóng.</p>
        </div>

        {/* Top actions */}
        <div className="flex gap-12">
          <button className="btn btn-secondary" onClick={() => alert('Đã xuất báo cáo CSV thành công!')}>
            <ExportIcon size={14} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={() => alert('Báo cáo chi tiết đang được tổng hợp...')}>
            <LightningIcon size={14} />
            <span>Báo Cáo Chi Tiết</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="filters-bar">
        {/* Time Filter */}
        <div className="filter-item">
          <span className="filter-label">THỜI GIAN</span>
          <select 
            className="input-field select-field" 
            value={timeRange} 
            onChange={(e) => { setTimeRange(e.target.value); setCurrentPage(1); }}
          >
            <option value="30 ngày gần nhất">30 ngày gần nhất</option>
            <option value="7 ngày gần nhất">7 ngày gần nhất</option>
            <option value="Hôm nay">Hôm nay</option>
          </select>
        </div>

        {/* Order Type Filter */}
        <div className="filter-item" style={{ minWidth: '220px' }}>
          <span className="filter-label">LOẠI LỆNH</span>
          <div className="filter-pills">
            {['ALL', 'BOT', 'SIGNAL'].map((type) => (
              <button
                key={type}
                type="button"
                className={`filter-pill ${typeFilter === type ? 'active' : ''}`}
                onClick={() => setTypeFilter(type)}
              >
                {type === 'ALL' ? 'Tất cả' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Pair input */}
        <div className="filter-item">
          <span className="filter-label">CẶP TIỀN</span>
          <input 
            type="text" 
            className="input-field" 
            placeholder="BTC, ETH..." 
            value={pairFilter}
            onChange={(e) => setPairFilter(e.target.value)}
          />
        </div>

        {/* Position Filter */}
        <div className="filter-item">
          <span className="filter-label">VỊ THẾ</span>
          <select 
            className="input-field select-field"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="ALL">Tất cả</option>
            <option value="Long">Long</option>
            <option value="Short">Short</option>
          </select>
        </div>

        {/* Filter Trigger Button */}
        <button 
          className="btn btn-secondary" 
          style={{ height: '40px', padding: '0 20px', border: '1px solid var(--border-color-light)' }}
          onClick={handleApplyFilter}
        >
          <FilterIcon size={14} />
          <span>Lọc Kết Quả</span>
        </button>
      </div>

      {/* History Data Table */}
      <div className="card" style={{ padding: '0 0 20px 0' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>THỜI GIAN</th>
                <th>CẶP TIỀN</th>
                <th>LOẠI</th>
                <th>VỊ THẾ</th>
                <th>SỐ TIỀN</th>
                <th>LỢI NHUẬN (PNL)</th>
                <th style={{ textAlign: 'right' }}>ROI (%)</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-mono" style={{ color: 'var(--text-secondary)' }}>{item.time}</td>
                    <td className="text-mono" style={{ fontWeight: '600' }}>
                      <span style={{ marginRight: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>●</span>
                      {item.pair}
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                        {item.type}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        backgroundColor: item.position === 'Long' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        color: item.position === 'Long' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                        border: 'none',
                        fontSize: '11px'
                      }}>
                        {item.position}
                      </span>
                    </td>
                    <td className="text-mono">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`text-mono ${item.pnl >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: '600' }}>
                      {item.pnl >= 0 ? '+' : ''}${item.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`text-mono ${item.roi >= 0 ? 'text-success' : 'text-danger'}`} style={{ textAlign: 'right', fontWeight: '600' }}>
                      <span style={{ 
                        backgroundColor: item.roi >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {item.roi >= 0 ? '+' : ''}{item.roi.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    Không có dữ liệu giao dịch phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex justify-between align-center" style={{ padding: '20px 20px 0 20px', borderTop: '1px solid var(--border-color)', marginTop: '20px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Hiển thị {filteredData.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredData.length)} trong số {filteredData.length} giao dịch
          </span>

          <div className="pagination">
            <button 
              className="pagination-btn" 
              onClick={handlePrevPage} 
              disabled={currentPage === 1}
              title="Trang trước"
            >
              <ChevronLeftIcon size={16} />
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button 
              className="pagination-btn" 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages}
              title="Trang sau"
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Metrics Cards */}
      <div className="history-footer-grid">
        {/* Card 1: Profit */}
        <div className="history-footer-card border-success" style={{ borderLeft: `3px solid ${isPnlPositive ? 'var(--color-success)' : 'var(--color-danger)'}` }}>
          <div className="title">TỔNG LỢI NHUẬN</div>
          <div className={`value ${isPnlPositive ? 'text-success' : 'text-danger'}`}>
            {isPnlPositive ? '+' : ''}${footerStats.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className={`sub ${isPnlPositive ? 'text-success' : 'text-danger'}`}>
            <TrendUpIcon size={10} className={isPnlPositive ? '' : 'trend-down'} />
            <span>+12.4% vs tháng trước</span>
          </div>
        </div>

        {/* Card 2: Win Rate */}
        <div className="history-footer-card border-success">
          <div className="title">WIN RATE</div>
          <div className="value">{footerStats.winRate.toFixed(1)}%</div>
          <div className="sub" style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', marginTop: '8px' }}>
            <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', width: '100%' }}>
              <div style={{ width: `${footerStats.winRate}%`, height: '100%', backgroundColor: 'var(--color-success)', borderRadius: '2px' }} />
            </div>
          </div>
        </div>

        {/* Card 3: Closed Trades */}
        <div className="history-footer-card border-accent">
          <div className="title">SỐ LỆNH ĐÃ ĐÓNG</div>
          <div className="value">{footerStats.closedTrades.toLocaleString()}</div>
          <div className="sub" style={{ color: 'var(--text-secondary)' }}>
            <span>THỰC HIỆN BỞI BOT ĐƯỢC CHỌN</span>
          </div>
        </div>

        {/* Card 4: Average ROI */}
        <div className="history-footer-card border-accent">
          <div className="title">AVERAGE ROI</div>
          <div className={`value ${footerStats.avgRoi >= 0 ? 'text-success' : 'text-danger'}`}>
            {footerStats.avgRoi >= 0 ? '+' : ''}{footerStats.avgRoi.toFixed(2)}%
          </div>
          <div className="sub" style={{ color: 'var(--text-secondary)' }}>
            <span>DỰA TRÊN KHOẢNG THỜI GIAN LỌC</span>
          </div>
        </div>
      </div>
    </div>
  );
};
