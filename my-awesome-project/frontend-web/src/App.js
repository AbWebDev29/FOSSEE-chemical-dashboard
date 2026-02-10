import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Scatter, Bar } from 'react-chartjs-2';
import './App.css';

ChartJS.register(
  ArcElement, Tooltip, Legend, 
  CategoryScale, LinearScale, PointElement, BarElement, Title
);

const EQUIPMENT_COLORS = {
  'Pump': '#22C1EE',
  'Compressor': '#FFCE56',
  'Reactor': '#00FFB2',
  'HeatExchanger': '#9D50BB',
  'Valve': '#FF4D8D',
  'Condenser': '#4E79F3',
  'Default': '#6B7280'
};

function App() {
  const [file, setFile] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ avgFlow: 0, avgPres: 0, healthScore: 100 });
  const [showModal, setShowModal] = useState(false);
  const [activeSummary, setActiveSummary] = useState(null);

  useEffect(() => { fetchHistory(); }, []);

  const calculateHealth = (rows) => {
    if (!rows || rows.length === 0) return 100;
    const criticalUnits = rows.filter(r => parseFloat(r.Pressure || 0) > 8.0).length;
    return Math.max(0, 100 - (criticalUnits * 5));
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
      const rows = res.data.data;
      const fSum = rows.reduce((acc, r) => acc + (parseFloat(r.Flowrate) || 0), 0);
      const pSum = rows.reduce((acc, r) => acc + (parseFloat(r.Pressure) || 0), 0);
      
      setStats({
        avgFlow: (fSum / rows.length).toFixed(2),
        avgPres: (pSum / rows.length).toFixed(2),
        healthScore: calculateHealth(rows)
      });
      setCurrentData(res.data);
      fetchHistory(); 
    } catch (err) { alert("Upload failed."); }
  };

  const thermalAggregate = useMemo(() => {
    if (!currentData?.data) return { labels: [], averages: [] };
    const totals = {};
    const counts = {};
    currentData.data.forEach(item => {
      const type = item.Type || 'Other';
      const temp = parseFloat(item.Temperature || 25);
      totals[type] = (totals[type] || 0) + temp;
      counts[type] = (counts[type] || 0) + 1;
    });
    const labels = Object.keys(totals);
    const averages = labels.map(label => (totals[label] / counts[label]).toFixed(1));
    return { labels, averages };
  }, [currentData]);

  // --- CHART CONFIGURATIONS ---

  // UPDATED PIE OPTIONS: Legend enabled with white text
  const doughnutOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#fff',
          padding: 10,
          font: { size: 10 }
        }
      }
    }
  };

  const scatterOptions = {
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Flow (m³/h)', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { title: { display: true, text: 'Pressure (bar)', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  const barOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { title: { display: true, text: 'Equipment Category', color: '#fff' } },
      y: { title: { display: true, text: 'Avg Temp (°C)', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  const doughnutData = useMemo(() => {
    if (!currentData?.type_distribution) return null;
    const labels = Object.keys(currentData.type_distribution);
    return {
      labels,
      datasets: [{
        data: Object.values(currentData.type_distribution),
        backgroundColor: labels.map(t => EQUIPMENT_COLORS[t] || EQUIPMENT_COLORS.Default),
        borderWidth: 0,
      }]
    };
  }, [currentData]);

  const scatterData = useMemo(() => {
    if (!currentData?.data) return { datasets: [] };
    return {
      datasets: [{
        label: 'Correlation',
        data: currentData.data.map(item => ({
          x: parseFloat(item.Flowrate || 0),
          y: parseFloat(item.Pressure || 0)
        })),
        backgroundColor: '#22C1EE',
      }]
    };
  }, [currentData]);

  const barData = useMemo(() => {
    return {
      labels: thermalAggregate.labels,
      datasets: [{
        data: thermalAggregate.averages,
        backgroundColor: thermalAggregate.labels.map(t => EQUIPMENT_COLORS[t] || EQUIPMENT_COLORS.Default),
        borderRadius: 5
      }]
    };
  }, [thermalAggregate]);

  const filteredEquipment = useMemo(() => {
    if (!currentData?.data) return [];
    return currentData.data.filter(item => 
      (item['Equipment Name'] || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentData, searchTerm]);

  return (
    <>
      <div className="bg-animations">
        <div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div>
      </div>

      {showModal && activeSummary && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h3>Analysis Summary</h3>
            <hr />
            <p><strong>File:</strong> {activeSummary.file_name}</p>
            <div className="modal-stats-grid">
              <div className="m-stat"><span>Avg Flow</span><strong>{activeSummary.avg_flowrate}</strong></div>
              <div className="m-stat"><span>Avg Pressure</span><strong>{activeSummary.avg_pressure}</strong></div>
            </div>
            <button className="btn-process" style={{marginTop: '20px', width: '100%'}} onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="recehtok-grid-container">
        <div className="row row-1-summary">
          <div className="summary-group">
            <div className="sum-box"><span className="label-mini">SYSTEM HEALTH</span><strong>{stats.healthScore}%</strong></div>
            <div className="sum-box"><span className="label-mini">AVG FLOW</span><strong>{stats.avgFlow} <small>m³/h</small></strong></div>
            <div className="sum-box"><span className="label-mini">AVG PRESSURE</span><strong>{stats.avgPres} <small>bar</small></strong></div>
          </div>
          <div className="upload-controls">
            <input type="file" id="file-csv" onChange={(e) => setFile(e.target.files[0])} hidden />
            <label htmlFor="file-csv" className="choose-file-label">{file ? file.name : 'Choose file'}</label>
            <button className="btn-process" onClick={handleUpload}>Analyze CSV</button>
            <button className="btn-pdf" onClick={() => window.open('http://127.0.0.1:8000/api/export-pdf/')}>Report</button>
          </div>
        </div>

        <div className="row row-2-analysis-grid">
          <div className="chart-box glass-panel">
            <span className="label-mini">EQUIPMENT MIX</span>
            <div className="chart-wrapper-small">
              {doughnutData && <Doughnut data={doughnutData} options={doughnutOptions} />}
            </div>
          </div>
          <div className="chart-box glass-panel">
            <span className="label-mini">P VS F (CORRELATION)</span>
            <div className="chart-wrapper-small">
              <Scatter data={scatterData} options={scatterOptions} />
            </div>
          </div>
          <div className="chart-box glass-panel">
            <span className="label-mini">AVG THERMAL PROFILE</span>
            <div className="chart-wrapper-small">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>

        <div className="row row-4-5-split">
          <div className="col-data">
            <div className="col-header">
              <span className="section-label">LIVE SPECIFICATIONS</span>
              <input type="text" className="minimal-search" placeholder="Filter..." onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="glass-panel scrollable">
              <table className="receh-table">
                <thead><tr><th>NAME</th><th>TYPE</th><th>FLOW</th><th>TEMP</th><th>PRESSURE</th></tr></thead>
                <tbody>
                  {filteredEquipment.map((item, i) => {
                    const pVal = parseFloat(item.Pressure || 0);
                    return (
                      <tr key={i}>
                        <td>{item['Equipment Name']}</td>
                        <td><span className="type-tag" style={{ color: EQUIPMENT_COLORS[item.Type] }}>{item.Type}</span></td>
                        <td>{item.Flowrate}</td>
                        <td>{item.Temperature || '25'}</td>
                        <td>
                          <div className="reliability-bar-container">
                            <div className="reliability-bar" style={{ background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', width: '80px', overflow: 'hidden' }}>
                              <div className="reliability-fill" style={{ width: `${Math.min(100, (pVal / 10) * 100)}%`, height: '100%', background: pVal > 8 ? '#FF4D8D' : '#00FFB2' }}></div>
                            </div>
                            <span style={{ marginLeft: '8px' }}>{pVal}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-history">
            <span className="section-label">ANALYSIS HISTORY</span>
            <div className="glass-panel scrollable">
              {history.map((h, i) => (
                <div key={i} className="history-item-card">
                  <div className="h-content-wrapper">
                    <strong>{h.file_name}</strong>
                    <div className="h-stats">F: {parseFloat(h.avg_flowrate).toFixed(1)} | P: {parseFloat(h.avg_pressure).toFixed(1)}</div>
                  </div>
                  <div className="history-hover-actions">
                    <button className="btn-h-small" onClick={() => { setActiveSummary(h); setShowModal(true); }}>View Summary</button>
                    <button className="btn-h-small secondary" onClick={() => {
                        setCurrentData({ data: h.data_json, type_distribution: h.type_distribution });
                        setStats({ avgFlow: h.avg_flowrate, avgPres: h.avg_pressure, healthScore: calculateHealth(h.data_json) });
                    }}>View Data</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;