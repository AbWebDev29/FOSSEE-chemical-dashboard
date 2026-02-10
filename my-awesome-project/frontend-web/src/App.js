import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, PointElement, BarElement, Title
} from 'chart.js';
import { Doughnut, Scatter, Bar } from 'react-chartjs-2';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, BarElement, Title);

const EQUIPMENT_COLORS = {
  'Pump': '#22C1EE', 'Compressor': '#FFCE56', 'Reactor': '#00FFB2',
  'HeatExchanger': '#9D50BB', 'Valve': '#FF4D8D', 'Condenser': '#4E79F3', 'Default': '#6B7280'
};

function App() {
  const [file, setFile] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCritical, setFilterCritical] = useState(false);
  const [stats, setStats] = useState({ avgFlow: 0, avgPres: 0, healthScore: 100, yield: 0 });
  const [showModal, setShowModal] = useState(false);
  const [activeSummary, setActiveSummary] = useState(null);
  

  useEffect(() => { fetchHistory(); }, []);

  // --- PREDICTIVE FAILURE LOGIC ---
  const calculateFailurePrediction = (pressure) => {
    const p = parseFloat(pressure);
    if (p <= 8.0) return null; 
    const hours = Math.max(1, Math.floor(48 * Math.exp(-0.8 * (p - 8))));
    return hours;
  };

  // Helper to calculate health based on pressure anomalies
  const getHealthFromData = (rows) => {
    if (!rows || rows.length === 0) return 100;
    const highPressureUnits = rows.filter(r => parseFloat(r.Pressure) > 8.0).length;
    return Math.max(0, 100 - (highPressureUnits * 15));
  };

  const calculateStats = (rows) => {
    if (!rows || rows.length === 0) return { avgFlow: 0, avgPres: 0, healthScore: 100, yield: 0 };
    const fValues = rows.map(r => parseFloat(r.Flowrate || 0));
    const pValues = rows.map(r => parseFloat(r.Pressure || 0));
    const meanF = fValues.reduce((a, b) => a + b, 0) / fValues.length;
    const meanP = pValues.reduce((a, b) => a + b, 0) / pValues.length;
    
    return {
      avgFlow: meanF.toFixed(2),
      avgPres: meanP.toFixed(2),
      yield: Math.min(((meanF / 120) * 100).toFixed(1), 100),
      healthScore: getHealthFromData(rows)
    };
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/history/');
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("History fetch failed"); }
  };

  const handleUpload = async () => {
  if (!file) return alert("Select file first");
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await axios.post('http://127.0.0.1:8000/api/upload/', formData);
    
    // Ensure you are setting the stats using the array at res.data.data
    setStats(calculateStats(res.data.data));
    
    // Set the full response so Doughnut and Stock Analysis can see it
    setCurrentData(res.data);
    
    fetchHistory(); 
  } catch (err) { 
    console.error("Upload failed", err); 
  }
};

  const thermalAggregate = useMemo(() => {
    if (!currentData?.data) return { labels: [], averages: [] };
    const totals = {}, counts = {};
    currentData.data.forEach(item => {
      const type = item.Type || 'Other';
      totals[type] = (totals[type] || 0) + parseFloat(item.Temperature || 25);
      counts[type] = (counts[type] || 0) + 1;
    });
    const labels = Object.keys(totals);
    return { labels, averages: labels.map(l => (totals[l] / counts[l]).toFixed(1)) };
  }, [currentData]);

  const filteredEquipment = useMemo(() => {
    if (!currentData?.data) return [];
    return currentData.data.filter(item => {
      const matchesSearch = (item['Equipment Name'] || "").toLowerCase().includes(searchTerm.toLowerCase());
      const isUnstable = parseFloat(item.Pressure) > 8.0;
      return filterCritical ? (matchesSearch && isUnstable) : matchesSearch;
    });
  }, [currentData, searchTerm, filterCritical]);

  const stockAnalysis = useMemo(() => {
  // 1. Unified data source: Use the array from history or the active upload
  const rawData = activeSummary?.data_json || currentData?.data;
  
  if (!rawData || !Array.isArray(rawData)) {
    return [];
  }

  // 2. Aggregate counts by Type
  const counts = {};
  rawData.forEach(item => {
    // Check for 'Type' or 'type' or 'Equipment Type'
    const category = item.Type || item.type || item['Equipment Type'] || "Unknown";
    counts[category] = (counts[category] || 0) + 1;
  });

  // 3. Transform into table format with thresholds
  return Object.keys(counts).map(cat => ({
    name: cat.toUpperCase(),
    qty: counts[cat],
    // Logic: 1 unit is understock, more than 5 is overflow
    status: counts[cat] <= 2 ? 'UNDERSTOCK' : (counts[cat] > 3 ? 'OVERFLOW' : 'OPTIMAL')
  }));
}, [currentData, activeSummary]);


  return (
    <>
      <div className="bg-animations">
        <div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div>
      </div>

      {/* --- UPDATED SUMMARY DIALOG BOX --- */}
      {showModal && activeSummary && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Batch Intelligence Summary</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <div className="modal-stats-grid">
              <div className="m-stat">
                <span>Yield</span>
                <strong>{((activeSummary.avg_flowrate / 120) * 100).toFixed(1)}%</strong>
              </div>
              <div className="m-stat">
                <span>Avg Flow</span>
                <strong>{parseFloat(activeSummary.avg_flowrate).toFixed(2)}</strong>
              </div>
              <div className="m-stat">
                <span>Avg Pres</span>
                <strong>{parseFloat(activeSummary.avg_pressure).toFixed(2)}</strong>
              </div>
              <div className="m-stat">
                <span>Sys Health</span>
                <strong style={{color: getHealthFromData(activeSummary.data_json) < 70 ? '#FF4D8D' : '#00FFB2'}}>
                  {getHealthFromData(activeSummary.data_json)}%
                </strong>
              </div>
            </div>

            <button className="btn-process" style={{marginTop:'20px', width:'100%'}} onClick={() => setShowModal(false)}>
              Close Summary
            </button>
          </div>
        </div>
      )}

      <div className="recehtok-grid-container">
        {/* ROW 1: KPIs */}
        <div className="row row-1-summary">
          <div className="summary-group">
            <div className="sum-box"><span className="label-mini">PROCESS YIELD</span><strong>{stats.yield}%</strong></div>
            <div className="sum-box"><span className="label-mini">AVG FLOW</span><strong>{stats.avgFlow}</strong></div>
            <div className="sum-box"><span className="label-mini">AVG PRESSURE</span><strong>{stats.avgPres}</strong></div>
            <div className="sum-box"><span className="label-mini">HEALTH</span><strong style={{color: stats.healthScore < 70 ? '#FF4D8D' : '#00FFB2'}}>{stats.healthScore}%</strong></div>
          </div>
          <div className="upload-controls">
            <input type="file" id="file-csv" onChange={(e) => setFile(e.target.files[0])} hidden />
            <label htmlFor="file-csv" className="choose-file-label">{file ? file.name : 'Select Data'}</label>
            <button className="btn-process" onClick={handleUpload}>Run Analysis</button>
            <button className="btn-pdf" onClick={() => window.open('http://127.0.0.1:8000/api/export-pdf/')}>Export PDF</button>
          </div>
        </div>

        {/* ROW 2: GRAPHS */}
        <div className="row row-2-analysis-grid">
          <div className="chart-box glass-panel"><span className="label-mini">ASSET DISTRIBUTION</span>
            <div className="chart-wrapper-small">{currentData && <Doughnut data={{ labels: Object.keys(currentData.type_distribution), datasets: [{ data: Object.values(currentData.type_distribution), backgroundColor: Object.keys(currentData.type_distribution).map(t => EQUIPMENT_COLORS[t] || EQUIPMENT_COLORS.Default), borderWidth: 0 }] }} options={{ maintainAspectRatio: false }} />}</div>
          </div>
          <div className="chart-box glass-panel"><span className="label-mini">P VS F CORRELATION</span>
            <div className="chart-wrapper-small"><Scatter data={{ datasets: [{ label: 'Units', data: currentData?.data?.map(i => ({ x: i.Flowrate, y: i.Pressure })), backgroundColor: '#22C1EE' }] }} options={{ maintainAspectRatio: false }} /></div>
          </div>
          <div className="chart-box glass-panel"><span className="label-mini">THERMAL DISTRIBUTION</span>
            <div className="chart-wrapper-small"><Bar data={{ labels: thermalAggregate.labels, datasets: [{ label: 'Temp', data: thermalAggregate.averages, backgroundColor: '#9D50BB' }] }} options={{ maintainAspectRatio: false }} /></div>
          </div>
        </div>

        {/* ROW 3: TABLE */}
        <div className="row row-4-5-split">
          <div className="col-data">
            <div className="col-header">
              <span className="section-label">PROACTIVE ASSET REGISTRY</span>
              <div className="header-actions">
                <div className={`glass-toggle ${filterCritical ? 'active' : ''}`} onClick={() => setFilterCritical(!filterCritical)}>
                  <div className="toggle-dot"></div><span>{filterCritical ? "FAILURES ONLY" : "ALL ASSETS"}</span>
                </div>
                <input type="text" className="minimal-search" placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="glass-panel scrollable">
              <table className="receh-table">
                <thead><tr><th>NAME</th><th>TYPE</th><th>FLOW</th><th>TEMP</th><th>PRESSURE</th><th>PREDICTED FAILURE</th><th>CONDITION</th></tr></thead>
                <tbody>
                  {filteredEquipment.map((item, i) => {
                    const pVal = parseFloat(item.Pressure || 0);
                    const hoursToFail = calculateFailurePrediction(pVal);
                    const isUnstable = pVal > 8.0;
                    return (
                      <tr key={i} className={isUnstable ? 'anomaly-row' : ''}>
                        <td>{item['Equipment Name']}</td>
                        <td><span className="type-tag" style={{ color: EQUIPMENT_COLORS[item.Type] }}>{item.Type}</span></td>
                        <td>{item.Flowrate}</td>
                        <td>{item.Temperature || '25'}</td>
                        <td>
                          <div className="pres-bar-container">
                             <div className="pres-bar-bg">
                               <div className={`pres-bar-fill ${isUnstable ? 'pulse-bar' : ''}`} style={{ width: `${Math.min(100, (pVal / 10) * 100)}%`, background: isUnstable ? '#FF4D8D' : '#00FFB2' }}></div>
                             </div>
                             <span className="pres-value">{pVal}</span>
                          </div>
                        </td>
                        <td>
                          {isUnstable ? (
                            <div className="failure-countdown">
                              <span className="countdown-clock">⏳ {hoursToFail} hrs</span>
                              <div className="risk-level" style={{width: `${100 - (hoursToFail * 2)}%`}}></div>
                            </div>
                          ) : <span style={{opacity: 0.3}}>Optimal</span>}
                        </td>
                        <td><span className="status-pill" style={{background: isUnstable ? '#FF4D8D' : '#00FFB2'}}>{isUnstable ? 'CRITICAL' : 'STABLE'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-history">
            <span className="section-label">LOGS</span>
            <div className="glass-panel scrollable">
              {history.map((h, i) => (
                <div key={i} className="history-item-card">
                  <div className="h-content-wrapper"><strong>{h.file_name}</strong><div className="h-stats">Yld: {((h.avg_flowrate / 120) * 100).toFixed(1)}%</div></div>
                  <div className="history-hover-actions">
                    <button className="btn-h-small" onClick={() => { setActiveSummary(h); setShowModal(true); }}>Summary</button>
                    <button className="btn-h-small secondary" onClick={() => { setCurrentData({ data: h.data_json, type_distribution: h.type_distribution }); setStats(calculateStats(h.data_json)); }}>Restore</button>
                  </div>
                </div>
              ))}
            </div>
            <span className="section-label">STOCK ANALYSIS (BY TYPE)</span>
  <div className="glass-panel">
  <table className="receh-table mini-table">
    <thead>
      <tr>
        <th style={{ textAlign: 'left', paddingLeft: '10px' }}>CATEGORY</th>
        <th style={{ textAlign: 'center' }}>QTY</th>
        <th style={{ textAlign: 'right', paddingRight: '10px' }}>STATUS</th>
      </tr>
    </thead>
    <tbody>
      {stockAnalysis.length > 0 ? (
        stockAnalysis.map((item, i) => (
          <tr key={i}>
            <td style={{ textAlign: 'left', paddingLeft: '10px', color: '#22C1EE', fontWeight: 'bold' }}>
              {item.name}
            </td>
            <td style={{ textAlign: 'center' }}>
              {item.qty}
            </td>
            <td style={{ textAlign: 'right', paddingRight: '10px' }}>
              <span className={`status-pill ${item.status}`}>
                {item.status}
              </span>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)' }}>
            Awaiting analysis...
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;