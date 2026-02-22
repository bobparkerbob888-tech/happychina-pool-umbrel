import React, { useState, useEffect } from 'react';
import { getWorkers, getPoolInfo } from '../services/api';
import { formatHashrate, formatTimeAgo, formatNumber } from '../utils/format';

function Workers() {
  const [workers, setWorkers] = useState([]);
  const [poolInfo, setPoolInfo] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getWorkers().then(res => setWorkers(res.data)),
      getPoolInfo().then(res => setPoolInfo(res.data)).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const coins = [...new Set(workers.map(w => w.coin))];
  const filtered = filter === 'all' ? workers :
    filter === 'online' ? workers.filter(w => w.is_online) :
    filter === 'offline' ? workers.filter(w => !w.is_online) :
    workers.filter(w => w.coin === filter);

  const onlineCount = workers.filter(w => w.is_online).length;
  const totalHashrate = workers.filter(w => w.is_online).reduce((s, w) => s + w.hashrate, 0);
  const bestShare = Math.max(0, ...workers.map(w => w.best_share || 0));

  // Time to find block calculation
  const getTimeToBlock = () => {
    if (!poolInfo || !totalHashrate) return 'N/A';
    // Find the primary coin being mined (first online worker's coin)
    const onlineWorker = workers.find(w => w.is_online);
    if (!onlineWorker) return 'N/A';
    const coinInfo = poolInfo.coins?.[onlineWorker.coin];
    if (!coinInfo?.network?.difficulty) return 'N/A';
    const netDiff = coinInfo.network.difficulty;
    // For scrypt: expected hashes = diff * 2^16; for sha256: diff * 2^32
    const algo = onlineWorker.algorithm;
    const multiplier = algo === 'scrypt' ? Math.pow(2, 16) : Math.pow(2, 32);
    const expectedSeconds = (netDiff * multiplier) / totalHashrate;
    if (expectedSeconds < 60) return `${Math.round(expectedSeconds)}s`;
    if (expectedSeconds < 3600) return `${Math.round(expectedSeconds / 60)}m`;
    if (expectedSeconds < 86400) return `${(expectedSeconds / 3600).toFixed(1)}h`;
    if (expectedSeconds < 86400 * 365) return `${(expectedSeconds / 86400).toFixed(1)}d`;
    return `${(expectedSeconds / (86400 * 365)).toFixed(1)}y`;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Workers</h1>
        <p>Manage and monitor your mining workers</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="label">Total Hashrate</div>
          <div className="value">{formatHashrate(totalHashrate)}</div>
        </div>
        <div className="stat-card green">
          <div className="label">Online Workers</div>
          <div className="value">{onlineCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Best Share</div>
          <div className="value">{formatNumber(bestShare, 0)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Est. Time to Block</div>
          <div className="value">{getTimeToBlock()}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Worker List</h2>
          <div className="tab-bar">
            <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`tab-btn ${filter === 'online' ? 'active' : ''}`} onClick={() => setFilter('online')}>Online</button>
            <button className={`tab-btn ${filter === 'offline' ? 'active' : ''}`} onClick={() => setFilter('offline')}>Offline</button>
            {coins.map(c => (
              <button key={c} className={`tab-btn ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><h3>No workers found</h3></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Worker Name</th>
                  <th>Coin</th>
                  <th>Hashrate</th>
                  <th>Difficulty</th>
                  <th>Best Share</th>
                  <th>Valid Shares</th>
                  <th>Invalid Shares</th>
                  <th>Last Share</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{w.name}</td>
                    <td>{w.coin}</td>
                    <td className="mono">{formatHashrate(w.hashrate)}</td>
                    <td className="mono">{formatNumber(w.difficulty, 0)}</td>
                    <td className="mono">{formatNumber(w.best_share || 0, 0)}</td>
                    <td className="mono" style={{ color: 'var(--green)' }}>{w.shares_valid}</td>
                    <td className="mono" style={{ color: w.shares_invalid > 0 ? 'var(--red)' : 'var(--text-secondary)' }}>{w.shares_invalid}</td>
                    <td>{formatTimeAgo(w.last_share)}</td>
                    <td>
                      <span className={`status-badge ${w.is_online ? 'online' : 'offline'}`}>
                        {w.is_online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Workers;
