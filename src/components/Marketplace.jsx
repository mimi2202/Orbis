// src/components/Marketplace.jsx - FIXED
import React from 'react';
import { useAppContext } from '../context/AppContext.jsx';
const Marketplace = () => {
  const { status } = useAppContext();
  const stats = status?.stats || { totalTrades: 0, winRate: 0, pnl: 0 };
  return (
    <div className="marketplace">
      <h3>📊 Marketplace Stats</h3>
      <div className="marketplace-grid">
        <div className="marketplace-card">
          <div className="label">Total Trades</div>
          <div className="value">{stats.totalTrades || 0}</div>
        </div>
        <div className="marketplace-card">
          <div className="label">Win Rate</div>
          <div className="value">{stats.winRate?.toFixed(1) || 0}%</div>
        </div>
        <div className="marketplace-card">
          <div className="label">Total P&L</div>
          <div className={'value ' + (stats.pnl >= 0 ? 'positive' : 'negative')}>
            
          </div>
        </div>
      </div>
    </div>
  );
};
export default Marketplace;
