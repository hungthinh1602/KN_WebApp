import React, { useState } from 'react';
import { CloseIcon } from './Icons';

export const DeployBotModal = ({ isOpen, onClose, onDeploy }) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [pair, setPair] = useState('BTC/USDT');
  const [strategy, setStrategy] = useState('Mean Reversion');
  const [capital, setCapital] = useState('1000');
  const [currency, setCurrency] = useState('USD');
  const [leverage, setLeverage] = useState('5x');
  
  // MT5 specific states
  const [isMt5Monitor, setIsMt5Monitor] = useState(false);
  const [mt5Login, setMt5Login] = useState('');
  const [mt5Password, setMt5Password] = useState('');
  const [mt5Server, setMt5Server] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên Bot!');
      return;
    }

    if (isMt5Monitor) {
      if (!mt5Login.trim() || !mt5Password.trim() || !mt5Server.trim()) {
        alert('Vui lòng nhập đầy đủ thông tin tài khoản MT5!');
        return;
      }
    }

    const newBot = {
      id: Date.now().toString(),
      name: name,
      pair: isMt5Monitor ? 'MT5 Account' : pair,
      strategy: isMt5Monitor ? 'MT5 Monitor' : strategy,
      isMt5: isMt5Monitor,
      mt5Login: isMt5Monitor ? mt5Login : null,
      mt5Password: isMt5Monitor ? mt5Password : null,
      mt5Server: isMt5Monitor ? mt5Server : null,
      status: 'RUNNING',
      profit: 0.00,
      capital: isMt5Monitor ? 0 : parseFloat(capital),
      currency: isMt5Monitor ? 'USD' : currency,
      leverage: isMt5Monitor ? '1x' : leverage,
      winRate: 0.0,
      trades: 0,
      avgProfit: 0.0,
      netProfit: 0.0,
      chartData: [0, 0, 0, 0, 0] // empty trend line
    };

    onDeploy(newBot);
    
    // Reset states
    setName('');
    setCapital('1000');
    setCurrency('USD');
    setMt5Login('');
    setMt5Password('');
    setMt5Server('');
    setIsMt5Monitor(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Deploy New Trading Bot</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Toggle Bot Mode */}
          <div className="form-group">
            <label className="form-label">Chế độ hoạt động</label>
            <div className="filter-pills" style={{ width: '100%' }}>
              <button
                type="button"
                className={`filter-pill ${!isMt5Monitor ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() => setIsMt5Monitor(false)}
              >
                Chiến lược ảo
              </button>
              <button
                type="button"
                className={`filter-pill ${isMt5Monitor ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() => setIsMt5Monitor(true)}
              >
                Theo dõi MT5 thật (Passview)
              </button>
            </div>
          </div>

          {/* Bot Name */}
          <div className="form-group">
            <label className="form-label">Tên Bot hiển thị</label>
            <input
              type="text"
              className="input-field"
              placeholder={isMt5Monitor ? "e.g. Tài Khoản MT5 Exness" : "e.g. Nexus Alpha v5"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Render inputs based on mode */}
          {!isMt5Monitor ? (
            <>
              {/* Virtual Trading Mode Fields */}
              <div className="form-group">
                <label className="form-label">Cặp Tiền Giao Dịch</label>
                <select
                  className="input-field select-field"
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                >
                  <option value="BTC/USDT">BTC / USDT</option>
                  <option value="ETH/USDT">ETH / USDT</option>
                  <option value="SOL/USDT">SOL / USDT</option>
                  <option value="GOLD/USD">GOLD / USD</option>
                  <option value="LINK/USDT">LINK / USDT</option>
                  <option value="ADA/USDT">ADA / USDT</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Chiến Lược Giao Dịch</label>
                <select
                  className="input-field select-field"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                >
                  <option value="Mean Reversion">Mean Reversion (Đảo chiều trung bình)</option>
                  <option value="Neutral Grid">Neutral Grid (Giao dịch lưới trung lập)</option>
                  <option value="Momentum">Momentum (Giao dịch theo đà tăng)</option>
                  <option value="Scalping V4">Scalping Strategy V4</option>
                  <option value="AI Neural Cluster">AI Neural Cluster</option>
                </select>
              </div>

              {/* Capital, Leverage & Currency */}
              <div className="grid-3" style={{ gap: '16px', marginBottom: '24px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Vốn đầu tư</label>
                  <input
                    type="number"
                    className="input-field"
                    min="1"
                    value={capital}
                    onChange={(e) => setCapital(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Đơn vị tiền tệ</label>
                  <select
                    className="input-field select-field"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="USC">CENT (USC)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Đòn Bẩy</label>
                  <select
                    className="input-field select-field"
                    value={leverage}
                    onChange={(e) => setLeverage(e.target.value)}
                  >
                    <option value="1x">1x</option>
                    <option value="2x">2x</option>
                    <option value="5x">5x (Mặc định)</option>
                    <option value="10x">10x</option>
                    <option value="20x">20x</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* MT5 Account Monitoring Fields */}
              <div className="form-group">
                <label className="form-label">Số Tài Khoản MT5 (Login ID)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Ví dụ: 6504281"
                  value={mt5Login}
                  onChange={(e) => setMt5Login(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu Passview (Investor Password)</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Chỉ có quyền xem thông số"
                  value={mt5Password}
                  onChange={(e) => setMt5Password(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Broker Server (Tên máy chủ)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: Exness-Real10 hoặc ICMarkets-Demo"
                  value={mt5Server}
                  onChange={(e) => setMt5Server(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between" style={{ gap: '12px', marginTop: '32px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {isMt5Monitor ? 'Kết nối & Theo dõi' : 'Kích hoạt Bot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
