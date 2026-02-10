import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const EQUIPMENT_COLORS = {
  'Pump': '#22C1EE',
  'Compressor': '#FFCE56',
  'Reactor': '#00FFB2',
  'HeatExchanger': '#9D50BB',
  'Valve': '#FF4D8D',
  'Condenser': '#4E79F3',
  'Default': '#A062FF'
};

function App() {
  const [file, setFile] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ avgFlow: 0, avgPres: 0, healthScore: 100 });

  // 1. Fetch History on Mount
  useEffect(() => { 
    fetchHistory(); 
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/history/');
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      console.error("History fetch failed"); 
    }
  };

  // 2. Handle File Upload
  const handleUpload = async () => {
    if (!file) return alert("Select file first");
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/upload/', formData);
      const rows = res.data.data;
      
      // Calculate stats for the summary boxes
      const fSum = rows.reduce((acc, r) => acc + (parseFloat(r.Flowrate) || 0), 0);
      const pSum = rows.reduce((acc, r) => acc + (parseFloat(r.Pressure) || 0), 0);
      const highPressureItems = rows.filter(r => parseFloat(r.Pressure) > 8).length;
      
      setStats({
        avgFlow: (fSum / rows.length).toFixed(2),
        avgPres: (pSum / rows.length).toFixed(2),
        healthScore: Math.max(0, 100 - (highPressureItems * 5)) 
      });
      
      setCurrentData(res.data);
      fetchHistory(); 
    } catch (err) { 
      alert("Upload failed. Ensure backend migrations are applied."); 
    }
  };

  // 3. Search Filter Logic (Safe check for currentData)
  const filteredEquipment = useMemo(() => {
    if (!currentData || !Array.isArray(currentData.data)) return [];
    return currentData.data.filter(item => 
      (item['Equipment Name'] || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item['Type'] || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentData, searchTerm]);

  // 4. Doughnut Chart Configuration
  const doughnutData = useMemo(() => {
    if (!currentData || !currentData.type_distribution) return null;
    const labels = Object.keys(currentData.type_distribution);
    return {
      labels: labels,
      datasets: [{
        data: Object.values(currentData.type_distribution),
        backgroundColor: labels.map(t => EQUIPMENT_COLORS[t] || EQUIPMENT_COLORS.Default),
        borderWidth: 0,
        hoverOffset: 20
      }]
    };
  }, [currentData]);

  return (
    <>
      {/* RESPONSIVE ANIMATED BACKGROUND */}
      <div className="bg-animations" style={{ 
        '--health-speed': `${stats.healthScore > 80 ? '25s' : '8s'}`,
        '--orb-color': stats.healthScore > 80 ? 'rgba(34, 193, 238, 0.3)' : 'rgba(255, 77, 141, 0.3)'
      }}>
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="recehtok-grid-container">
        
        {/* ROW 1: SUMMARY BOXES & UPLOAD */}
        <div className="row row-1-summary">
          <div className="summary-group">
            <div className={`sum-box highlight-card ${stats.healthScore < 80 ? 'warning-pulse' : ''}`}>
              <span className="label-mini">SYSTEM HEALTH</span>
              <strong>{stats.healthScore}%</strong>
            </div>
            <div className="sum-box">
              <span className="label-mini">TOTAL RECORDS</span>
              <strong>{currentData?.data?.length || 0}</strong>
            </div>
            <div className="sum-box">
              <span className="label-mini">AVG FLOWRATE</span>
              <strong>{stats.avgFlow} <small>m³/h</small></strong>
            </div>
            <div className="sum-box">
              <span className="label-mini">AVG PRESSURE</span>
              <strong>{stats.avgPres} <small>bar</small></strong>
            </div>
          </div>
          
          <div className="upload-controls">
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button className="btn-process" onClick={handleUpload}>Analyze CSV</button>
            <button className="btn-pdf" onClick={() => window.open('http://127.0.0.1:8000/api/export-pdf/')}>Report</button>
          </div>
        </div>

        {/* ROW 2 & 3: CENTER CHART */}
        <div className="row row-2-3-graph">
          <div className="chart-wrapper">
            {doughnutData && (
              <>
                <Doughnut 
                  data={doughnutData} 
                  options={{ cutout: '75%', plugins: { legend: { display: false } }, maintainAspectRatio: false }} 
                />
                <div className="chart-center-val">
                  <span className="center-num">{currentData?.data?.length || 0}</span>
                  <span className="center-sub">UNITS</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ROW 4 & 5: TABLE & HISTORY SPLIT */}
        <div className="row row-4-5-split">
          
          {/* LEFT COLUMN: EQUIPMENT TABLE */}
          <div className="col-data">
            <div className="col-header">
              <span className="section-label">EQUIPMENT DATA</span>
              <input 
                type="text" 
                className="search-bar" 
                placeholder="Search equipment..." 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="glass-panel scrollable">
              <table className="receh-table">
                <thead>
                  <tr>
                      <th>NAME</th>
                      <th>TYPE</th>
                      <th>FLOW</th>
                      <th>TEMP (°C)</th>
                      <th>PRESSURE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipment.map((item, i) => (
                    <tr key={i} className="data-row-hover">
                      <td>{item['Equipment Name']}</td>
                      <td>
                          <span className="type-tag" style={{ color: EQUIPMENT_COLORS[item.Type], background: `${EQUIPMENT_COLORS[item.Type]}22` }}>
                              {item['Type']}
                          </span>
                      </td>
                      <td>{item['Flowrate']}</td>
                      <td>{item['Temperature'] || '25'}</td>
                      <td>
                         <div className="reliability-bar-container">
                          <div className="reliability-bar">
                            <div className="reliability-fill" style={{ width: `${Math.min(100, (item.Pressure * 10))}%`, background: item.Pressure > 8 ? '#FF4D8D' : '#00FFB2' }}></div>
                          </div>
                          <span className="pressure-val">{item.Pressure}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE HISTORY */}
          <div className="col-history">
            <span className="section-label">ANALYSIS HISTORY</span>
            <div className="glass-panel scrollable">
              {history.map((h, i) => {
                const hFlow = parseFloat(h.avg_flowrate || 0).toFixed(2);
                const hPres = parseFloat(h.avg_pressure || 0).toFixed(2);

                return (
                  <div key={i} className="history-item-card">
                    <div className="h-content-wrapper">
                      <div className="h-header"><strong>{h.file_name}</strong></div>
                      <div className="h-stats">
                        <span>F: {hFlow}</span>
                        <span>P: {hPres}</span>
                      </div>
                      <div className="h-footer">{new Date(h.uploaded_at).toLocaleDateString()}</div>
                    </div>

                    {/* HOVER OVERLAY */}
                    <div className="history-hover-overlay">
                      <button className="btn-h-action view-data" onClick={() => {
                          if (h.data_json) {
                            setCurrentData({ 
                              data: h.data_json, 
                              type_distribution: h.type_distribution 
                            });
                            setStats({ 
                              avgFlow: hFlow, 
                              avgPres: hPres, 
                              healthScore: 100 // Or calculate based on loaded data
                            });
                          } else {
                            alert("Detailed data snapshot not found for this record.");
                          }
                      }}>View Data</button>
                      
                      <button className="btn-h-action view-summary" onClick={() => {
                          alert(`Summary: ${h.file_name}\n\nAvg Flowrate: ${hFlow} m³/h\nAvg Pressure: ${hPres} bar\nDate: ${new Date(h.uploaded_at).toLocaleString()}`);
                      }}>Summary</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default App;