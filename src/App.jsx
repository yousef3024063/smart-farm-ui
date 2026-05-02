import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { ref, onValue, set, push, query, limitToLast } from 'firebase/database';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

// API Configuration
const defaultModelName = import.meta.env.VITE_LM_STUDIO_MODEL || "llama-2-7b-chat";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appError, setAppError] = useState(null);
  const [modelName, setModelName] = useState(() => localStorage.getItem('modelName') || defaultModelName);
  const [sensors, setSensors] = useState({ temp: 0, humidity: 0, moisture: 0, light: 0 });
  const [controls, setControls] = useState({
    mode: 'AUTO',
    tungsten: false,
    whiteLED: false,
    blueLED: false,
    minRange: false,
    waterPump: false,
    fans: false
  });
  const [history, setHistory] = useState({
    labels: [], temp: [], humidity: [], moisture: [], light: []
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const [activeCrop, setActiveCrop] = useState('mushroom');
  const [cropParams, setCropParams] = useState(null);

  const [alerts, setAlerts] = useState([]);
  const prevSensorsRef = useRef({ temp: 0, humidity: 0, moisture: 0, light: 0 });
  const isFirstLoadRef = useRef(true);

  // Monitor sensor changes to generate alerts
  useEffect(() => {
    if (isFirstLoadRef.current) {
      if (sensors.temp !== 0 || sensors.humidity !== 0 || sensors.moisture !== 0) {
        isFirstLoadRef.current = false;
        prevSensorsRef.current = sensors;
      }
      return;
    }

    const prev = prevSensorsRef.current;
    const current = sensors;
    const newAlerts = [];
    const timestamp = new Date().toLocaleTimeString();

    // Sudden Temperature Shifts (Delta >= 10)
    const tempDelta = current.temp - prev.temp;
    if (tempDelta >= 10) {
      newAlerts.push({ time: timestamp, type: 'warning', msg: `Sudden temperature rise (+${tempDelta.toFixed(1)}°C)! Ventilation fans activated.` });
    } else if (tempDelta <= -10) {
      newAlerts.push({ time: timestamp, type: 'success', msg: `Sudden temperature drop (${tempDelta.toFixed(1)}°C). Returning to normal, fans turned off.` });
    }

    // Sudden Moisture Shifts (Delta >= 15)
    const moistureDelta = current.moisture - prev.moisture;
    if (moistureDelta <= -15) {
      newAlerts.push({ time: timestamp, type: 'warning', msg: `Sudden soil moisture drop (${moistureDelta.toFixed(1)}%)! Water pump started.` });
    } else if (moistureDelta >= 15) {
      newAlerts.push({ time: timestamp, type: 'success', msg: `Soil moisture replenished (+${moistureDelta.toFixed(1)}%). Returning to normal, pump stopped.` });
    }

    // Sudden Light Shifts (Delta >= 20)
    const lightDelta = current.light - prev.light;
    if (lightDelta <= -20) {
      newAlerts.push({ time: timestamp, type: 'warning', msg: `Sudden light level drop (${lightDelta.toFixed(1)}%)! Grow LEDs activated.` });
    } else if (lightDelta >= 20) {
      newAlerts.push({ time: timestamp, type: 'success', msg: `Light level restored (+${lightDelta.toFixed(1)}%). Returning to normal, LEDs turned off.` });
    }

    if (newAlerts.length > 0) {
      const logsRef = ref(db, 'activity_logs');
      newAlerts.forEach(alert => push(logsRef, alert));
    }

    prevSensorsRef.current = current;
  }, [sensors]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatMessages]);

  // --- FIREBASE LISTENERS ---
  useEffect(() => {
    try {
      const sensorRef = ref(db, 'live_sensors');
      const controlRef = ref(db, 'controls');
      const envRef = ref(db, 'env_settings');

      const unsubscribeSensors = onValue(sensorRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setSensors(data);

          const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          setHistory(prev => {
            const newLabels = [...prev.labels, currentTime].slice(-15);
            const newTemp = [...prev.temp, data.temp || 0].slice(-15);
            const newHumidity = [...prev.humidity, data.humidity || 0].slice(-15);
            const newMoisture = [...prev.moisture, data.moisture || 0].slice(-15);
            const newLight = [...prev.light, data.light || 0].slice(-15);
            return { labels: newLabels, temp: newTemp, humidity: newHumidity, moisture: newMoisture, light: newLight };
          });
        }
      });

      const unsubscribeControls = onValue(controlRef, (snapshot) => {
        if (snapshot.exists()) setControls(snapshot.val());
      });

      const unsubscribeEnv = onValue(envRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.active_crop) setActiveCrop(data.active_crop);
          if (data.parameters) setCropParams(data.parameters);
        }
      });

      const logsQuery = query(ref(db, 'activity_logs'), limitToLast(50));
      const unsubscribeLogs = onValue(logsQuery, (snapshot) => {
        if (snapshot.exists()) {
          const logsData = snapshot.val();
          const logsArray = Object.keys(logsData).sort().map(k => logsData[k]).reverse();
          setAlerts(logsArray);
        } else {
          setAlerts([]);
        }
      });

      return () => {
        unsubscribeSensors();
        unsubscribeControls();
        unsubscribeEnv();
        unsubscribeLogs();
      };
    } catch (error) {
      console.error('Firebase error:', error);
      setAppError(`Firebase connection error: ${error.message}`);
    }
  }, []);

  // --- HARDWARE & ENV LOGIC ---
  const toggleHardware = (key) => {
    const newValue = key === 'mode'
      ? (controls.mode === 'AUTO' ? 'MANUAL' : 'AUTO')
      : !controls[key];

    set(ref(db, `controls/${key}`), newValue);
  };

  const handleCropChange = (crop) => {
    setActiveCrop(crop);
    set(ref(db, 'env_settings/active_crop'), crop);

    if (crop === 'lettuce') {
      set(ref(db, 'env_settings/parameters'), {
        temperature: '16°C to 22°C (Ideal for vegetative growth; bolts > 24°C)',
        light: 'High Intensity: 14 to 16 hours. Crucial for photosynthesis and biomass production.',
        humidity: 'Moderate: 50% to 70% relative humidity. (Higher risks fungal disease on leaves).',
        moisture: 'Moderate/High: Consistent moisture at the root zone, but must have good drainage.',
        gas: 'High CO2 intake / High O2 output'
      });
    } else {
      set(ref(db, 'env_settings/parameters'), {
        temperature: '18°C to 22°C (Ideal for fruiting)',
        light: 'Low Intensity: 10 to 12 hours. Used only as a directional signal for cap growth, not for energy.',
        humidity: 'High: 85% to 95% relative humidity.',
        moisture: 'High: 60% to 80% water content in the mycelial block.',
        gas: 'High O2 intake / High CO2 output'
      });
    }
  };

  // --- AI CHAT LOGIC ---
  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    const messagesToSend = [...chatMessages, userMessage];
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    try {
      console.log('Sending to Vercel API route: /api/chat');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: messagesToSend,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiText = data?.choices?.[0]?.message?.content || 'No response text available.';
      const aiMessage = { role: 'assistant', content: aiText };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Make sure LM Studio is running on the local network.`
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  // --- LIVE CHART CONFIGURATION ---
  const getChartOptions = (yAxisTitle, maxVal) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: {
        type: 'linear', position: 'left',
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#8e8e93' },
        ...(maxVal ? { min: 0, max: maxVal } : {}),
        title: { display: true, text: yAxisTitle, color: '#8e8e93' }
      },
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#8e8e93', maxRotation: 45, minRotation: 45 }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(28, 28, 30, 0.9)', titleColor: '#fff', padding: 12, borderRadius: 12 }
    }
  });

  return (
    <div className="apple-dashboard">

      {/* HEADER & TABS */}
      <header className="app-header">
        <div className="header-titles">
          <h1>Smart Farm</h1>
          <div className={`status-indicator ${controls.mode}`}>
            <div className="dot"></div>
            {controls.mode}
          </div>
        </div>

        <div className="segmented-control">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            Dashboard
          </button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
            Profile
          </button>
          <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
            Analytics
          </button>
          <button className={activeTab === 'alerts' ? 'active' : ''} onClick={() => setActiveTab('alerts')}>
            Alerts
          </button>
          <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>
            AI Chat
          </button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
            Settings
          </button>
        </div>
      </header>

      {/* ERROR DISPLAY */}
      {appError && (
        <div style={{ background: '#ff3b30', color: 'white', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          ⚠️ {appError}
        </div>
      )}

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="tab-content fade-in">

          {/* 4 SENSOR CARDS */}
          <div className="metrics-row">
            <div className="apple-card hover-effect">
              <p className="card-label">Air Temp</p>
              <h2>{sensors.temp}°C</h2>
            </div>
            <div className="apple-card hover-effect">
              <p className="card-label">Air Humidity</p>
              <h2>{sensors.humidity}%</h2>
            </div>
            <div className="apple-card hover-effect">
              <p className="card-label">Soil Moisture</p>
              <h2>{sensors.moisture}%</h2>
            </div>
            <div className="apple-card hover-effect">
              <p className="card-label">Light Level</p>
              <h2>{sensors.light}%</h2>
            </div>
          </div>

          <div className="apple-card crop-selector-card" style={{ marginBottom: '24px' }}>
            <div className="controls-header" style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontWeight: 600 }}>Environment Profile</h3>
              <div className="segmented-control" style={{ margin: 0 }}>
                <button className={activeCrop === 'mushroom' ? 'active' : ''} onClick={() => handleCropChange('mushroom')}>
                  🍄 Mushroom
                </button>
                <button className={activeCrop === 'lettuce' ? 'active' : ''} onClick={() => handleCropChange('lettuce')}>
                  🥬 Lettuce
                </button>
              </div>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
               System Target: {activeCrop === 'mushroom' ? '18°C-22°C | 85-95% RH' : '16°C-22°C | 50-70% RH'}
            </p>
          </div>

          <div className="apple-card controls-section">
            <div className="controls-header">
              <h3>Hardware Overrides</h3>
              <button className={`mode-toggle ${controls.mode}`} onClick={() => toggleHardware('mode')}>
                {controls.mode === 'AUTO' ? 'Switch to Manual' : 'Switch to Auto'}
              </button>
            </div>

            <div className="hardware-grid">
              <button className={`apple-btn tungsten ${controls.tungsten ? 'active' : ''}`} disabled={controls.mode === 'AUTO'} onClick={() => toggleHardware('tungsten')}>Tungsten Lamp</button>
              <button className={`apple-btn white ${controls.whiteLED ? 'active' : ''}`} disabled={controls.mode === 'AUTO'} onClick={() => toggleHardware('whiteLED')}>White LED</button>
              <button className={`apple-btn blue ${controls.blueLED ? 'active' : ''}`} disabled={controls.mode === 'AUTO'} onClick={() => toggleHardware('blueLED')}>Blue LED</button>
              
              <button 
                 className={`apple-btn red ${controls.minRange ? 'active' : ''}`} 
                 disabled={controls.mode === 'MANUAL'} 
                 onClick={() => toggleHardware('minRange')}
              >
                Target Min Range
              </button>
              
              <button className={`apple-btn pump ${controls.waterPump ? 'active' : ''}`} disabled={controls.mode === 'AUTO'} onClick={() => toggleHardware('waterPump')}>Water Pump</button>
              <button className={`apple-btn fan ${controls.fans ? 'active' : ''}`} disabled={controls.mode === 'AUTO'} onClick={() => toggleHardware('fans')}>Ventilation Fans</button>
            </div>

            {controls.mode === 'AUTO' && (
              <p className="lock-text">Manual Overrides disabled in AUTO. You can toggle "Target Min Range" to stay at the lowest temp/humidity bounds.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE */}
      {activeTab === 'profile' && (
        <div className="tab-content fade-in">
          <div className="apple-card crop-selector-card" style={{ marginBottom: '24px' }}>
            <div className="controls-header" style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontWeight: 600 }}>Target Environment Config</h3>
              <div className="segmented-control" style={{ margin: 0 }}>
                <button className={activeCrop === 'mushroom' ? 'active' : ''} onClick={() => handleCropChange('mushroom')}>
                  🍄 Mushroom
                </button>
                <button className={activeCrop === 'lettuce' ? 'active' : ''} onClick={() => handleCropChange('lettuce')}>
                  🥬 Lettuce
                </button>
              </div>
            </div>

            {cropParams ? (
              <div className="crop-params-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(120px, 180px) 1fr',
                gap: '12px',
                marginTop: '16px',
                fontSize: '15px',
                background: 'rgba(0,0,0,0.2)',
                padding: '20px',
                borderRadius: '12px'
              }}>
                <div style={{ color: 'var(--text-muted)' }}>Temperature</div>
                <div style={{ fontWeight: 500 }}>{cropParams.temperature}</div>

                <div style={{ color: 'var(--text-muted)' }}>Light (White LEDs)</div>
                <div style={{ fontWeight: 500 }}>{cropParams.light}</div>

                <div style={{ color: 'var(--text-muted)' }}>Ambient Humidity</div>
                <div style={{ fontWeight: 500 }}>{cropParams.humidity}</div>

                <div style={{ color: 'var(--text-muted)' }}>Root/Sub Moisture</div>
                <div style={{ fontWeight: 500 }}>{cropParams.moisture}</div>

                <div style={{ color: 'var(--text-muted)' }}>Gas Exchange</div>
                <div style={{ fontWeight: 500 }}>{cropParams.gas}</div>
              </div>
            ) : (
              <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                Please select a crop profile above to sync the environment parameters with Firebase.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="tab-content fade-in">
          <div className="charts-grid">
            <div className="apple-card chart-container">
              <h3>Air Temperature</h3>
              <div className="chart-wrapper">
                <Line
                  data={{
                    labels: history.labels,
                    datasets: [{
                      label: 'Temp (°C)',
                      data: history.temp,
                      borderColor: '#ff3b30',
                      backgroundColor: 'rgba(255, 59, 48, 0.1)',
                      borderWidth: 2, tension: 0.4, fill: true,
                    }]
                  }}
                  options={getChartOptions('Celsius', 100)}
                />
              </div>
            </div>

            <div className="apple-card chart-container">
              <h3>Air Humidity</h3>
              <div className="chart-wrapper">
                <Line
                  data={{
                    labels: history.labels,
                    datasets: [{
                      label: 'Air Humidity (%)',
                      data: history.humidity,
                      borderColor: '#32ade6',
                      backgroundColor: 'rgba(50, 173, 230, 0.1)',
                      borderWidth: 2, tension: 0.4, fill: true,
                    }]
                  }}
                  options={getChartOptions('Percentage (%)', 100)}
                />
              </div>
            </div>

            <div className="apple-card chart-container">
              <h3>Soil Moisture</h3>
              <div className="chart-wrapper">
                <Line
                  data={{
                    labels: history.labels,
                    datasets: [{
                      label: 'Soil Moisture (%)',
                      data: history.moisture,
                      borderColor: '#30d158',
                      backgroundColor: 'rgba(48, 209, 88, 0.1)',
                      borderWidth: 2, tension: 0.4, fill: true,
                    }]
                  }}
                  options={getChartOptions('Percentage (%)', 100)}
                />
              </div>
            </div>

            <div className="apple-card chart-container">
              <h3>Light Level</h3>
              <div className="chart-wrapper">
                <Line
                  data={{
                    labels: history.labels,
                    datasets: [{
                      label: 'Light Level (%)',
                      data: history.light,
                      borderColor: '#ffcc00',
                      backgroundColor: 'rgba(255, 204, 0, 0.1)',
                      borderWidth: 2, tension: 0.4, fill: true,
                    }]
                  }}
                  options={getChartOptions('Percentage (%)', 100)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALERTS */}
      {activeTab === 'alerts' && (
        <div className="tab-content fade-in">
          <div className="apple-card alerts-container">
            <h3>System Activity Log</h3>
            {alerts.length === 0 ? (
              <p className="no-alerts">No alerts at the moment. System operating normally.</p>
            ) : (
              <div className="alerts-list">
                {alerts.map((alert, index) => (
                  <div key={index} className={`alert-item ${alert.type}`}>
                    <span className="alert-time">{alert.time}</span>
                    <span className="alert-msg">{alert.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AI CHAT */}
      {activeTab === 'chat' && (
        <div className="tab-content fade-in">
          <div className="apple-card chat-container">
            <h3>AI Assistant</h3>
            <div className="chat-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))}
            </div>
            <div className="chat-input-container">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything about your smart farm..."
                className="chat-input"
              />
              <button onClick={sendMessage} className="apple-btn send-btn">Send</button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="tab-content fade-in">
          <div className="apple-card">
            <h3>AI Configuration</h3>
            
            <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(0,255,0,0.1)', borderRadius: '8px', borderLeft: '4px solid #30d158' }}>
              <p style={{ margin: 0, color: '#30d158', fontSize: '14px', fontWeight: 500 }}>✓ Connected to LM Studio via Vercel API</p>
              <small style={{ display: 'block', marginTop: '6px', color: '#8e8e93' }}>
                No ngrok or external tunnels needed. All requests go through Vercel backend.
              </small>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Model Name:
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => {
                  setModelName(e.target.value);
                  localStorage.setItem('modelName', e.target.value);
                }}
                placeholder="llama-2-7b-chat"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <small style={{ display: 'block', marginTop: '8px', color: '#8e8e93' }}>
                Change the model name if using a different LM Studio model
              </small>
            </div>

            <button
              onClick={() => {
                localStorage.setItem('modelName', defaultModelName);
                setModelName(defaultModelName);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: '#8e8e93',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Reset to Default Model
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;