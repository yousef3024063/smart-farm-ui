import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, set } from 'firebase/database';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend
} from 'chart.js';

// API Configuration from environment variables
const apiBaseUrl = import.meta.env.VITE_LM_STUDIO_API_URL || "http://localhost:1234/v1";
const apiKey = import.meta.env.VITE_LM_STUDIO_API_KEY || "lm-studio";
const modelName = import.meta.env.VITE_LM_STUDIO_MODEL || "llama-2-7b-chat";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appError, setAppError] = useState(null);
  const [sensors, setSensors] = useState({ temp: 0, humidity: 0, moisture: 0, light: 0 });
  const [controls, setControls] = useState({
    mode: 'AUTO',
    tungsten: false,
    whiteLED: false,
    blueLED: false,
    redLED: false,
    waterPump: false,
    fans: false
  });
  const [history, setHistory] = useState({
    labels: [], temp: [], humidity: [], moisture: [], light: []
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

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

      return () => {
        unsubscribeSensors();
        unsubscribeControls();
      };
    } catch (error) {
      console.error('Firebase error:', error);
      setAppError(`Firebase connection error: ${error.message}`);
    }
  }, []);

  // --- HARDWARE LOGIC ---
  const toggleHardware = (key) => {
    const newValue = key === 'mode' 
      ? (controls.mode === 'AUTO' ? 'MANUAL' : 'AUTO') 
      : !controls[key];
    
    set(ref(db, `controls/${key}`), newValue);
  };

  // --- AI CHAT LOGIC ---
  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    const messagesToSend = [...chatMessages, userMessage];
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    try {
      console.log('Sending to:', apiBaseUrl);
      const response = await fetch(`${apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
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
        content: `Sorry, I encountered an error: ${error.message}. Make sure LM Studio is running at ${apiBaseUrl}` 
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  // --- LIVE CHART CONFIGURATION ---
  const chartData = {
    labels: history.labels,
    datasets: [
      {
        label: 'Temp (°C)',
        data: history.temp,
        borderColor: '#ff3b30', // iOS Red
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderWidth: 2, tension: 0.4, yAxisID: 'yTemp',
      },
      {
        label: 'Air Humidity (%)',
        data: history.humidity,
        borderColor: '#32ade6', // iOS Cyan
        backgroundColor: 'rgba(50, 173, 230, 0.1)',
        borderWidth: 2, tension: 0.4, yAxisID: 'yPercent',
      },
      {
        label: 'Soil Moisture (%)',
        data: history.moisture,
        borderColor: '#30d158', // iOS Green
        backgroundColor: 'rgba(48, 209, 88, 0.1)',
        borderWidth: 2, tension: 0.4, yAxisID: 'yPercent',
      },
      {
        label: 'Light Level (%)',
        data: history.light,
        borderColor: '#ffcc00', // iOS Yellow
        backgroundColor: 'rgba(255, 204, 0, 0.1)',
        borderWidth: 2, tension: 0.4, yAxisID: 'yPercent',
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      yTemp: { 
        type: 'linear', position: 'left', 
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#8e8e93' },
        title: { display: true, text: 'Celsius', color: '#8e8e93' }
      },
      // Combined Y-axis for Humidity, Soil Moisture, and Light since they are all percentages
      yPercent: { 
        type: 'linear', position: 'right', 
        grid: { drawOnChartArea: false },
        ticks: { color: '#8e8e93' },
        min: 0, max: 100,
        title: { display: true, text: 'Percentage (%)', color: '#8e8e93' }
      },
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#8e8e93', maxRotation: 45, minRotation: 45 }
      }
    },
    plugins: { 
      legend: { labels: { color: '#ffffff', usePointStyle: true, boxWidth: 8 } },
      tooltip: { backgroundColor: 'rgba(28, 28, 30, 0.9)', titleColor: '#fff', padding: 12, borderRadius: 12 }
    }
  };

  return (
    <div className="apple-dashboard" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ERROR DISPLAY */}
      {appError && (
        <div style={{ background: '#ff3b30', color: 'white', padding: '16px', borderRadius: '8px', margin: '16px', textAlign: 'center' }}>
          <strong>⚠️ Error:</strong> {appError}
        </div>
      )}

      {/* HEADER & TABS */}
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="header-titles" style={{ marginBottom: '10px' }}>
          <h1 style={{ margin: '0', color: '#fff', fontSize: '32px' }}>🌱 Smart Farm</h1>
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#8e8e93' }}>
            Mode: <strong style={{ color: controls.mode === 'AUTO' ? '#30d158' : '#ff9f0a' }}>{controls.mode}</strong>
          </div>
        </div>
        
        <div className="segmented-control" style={{ display: 'flex', gap: '8px' }}>
          {['dashboard', 'analytics', 'chat'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === tab ? '#0a84ff' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'dashboard' && '📊'} {tab === 'analytics' && '📈'} {tab === 'chat' && '💬'} {tab}
            </button>
          ))}
        </div>
      </header>

      {/* CONTENT AREA */}
      <div style={{ flex: 1, minHeight: '400px' }}>
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(28,28,30,0.8)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ margin: '0 0 4px 0', color: '#8e8e93', fontSize: '12px' }}>Temperature</p>
                <h2 style={{ margin: '0', fontSize: '32px', color: '#ff3b30' }}>{sensors.temp || '-- '}°C</h2>
              </div>
              <div style={{ background: 'rgba(28,28,30,0.8)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ margin: '0 0 4px 0', color: '#8e8e93', fontSize: '12px' }}>Humidity</p>
                <h2 style={{ margin: '0', fontSize: '32px', color: '#32ade6' }}>{sensors.humidity || '-- '}%</h2>
              </div>
              <div style={{ background: 'rgba(28,28,30,0.8)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ margin: '0 0 4px 0', color: '#8e8e93', fontSize: '12px' }}>Soil Moisture</p>
                <h2 style={{ margin: '0', fontSize: '32px', color: '#30d158' }}>{sensors.moisture || '-- '}%</h2>
              </div>
              <div style={{ background: 'rgba(28,28,30,0.8)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ margin: '0 0 4px 0', color: '#8e8e93', fontSize: '12px' }}>Light Level</p>
                <h2 style={{ margin: '0', fontSize: '32px', color: '#ffcc00' }}>{sensors.light || '-- '}%</h2>
              </div>
            </div>

            <div style={{ background: 'rgba(28,28,30,0.8)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ marginTop: '0', marginBottom: '16px' }}>Device Controls</h3>
              <button 
                onClick={() => toggleHardware('mode')}
                style={{
                  padding: '12px 20px',
                  background: controls.mode === 'AUTO' ? '#30d158' : '#ff9f0a',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  width: '100%'
                }}
              >
                Mode: {controls.mode} → Switch to {controls.mode === 'AUTO' ? 'MANUAL' : 'AUTO'}
              </button>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                {[
                  { key: 'tungsten', label: '🔥 Heater' },
                  { key: 'whiteLED', label: '⚪ White LED' },
                  { key: 'blueLED', label: '🔵 Blue LED' },
                  { key: 'redLED', label: '🔴 Red LED' },
                  { key: 'waterPump', label: '💧 Pump' },
                  { key: 'fans', label: '🌬️ Fan' }
                ].map(device => (
                  <button
                    key={device.key}
                    onClick={() => toggleHardware(device.key)}
                    disabled={controls.mode === 'AUTO'}
                    style={{
                      padding: '10px',
                      background: controls[device.key] ? '#0a84ff' : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: controls.mode === 'AUTO' ? 'not-allowed' : 'pointer',
                      opacity: controls.mode === 'AUTO' ? 0.5 : 1,
                      fontSize: '12px'
                    }}
                  >
                    {device.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div style={{ background: 'rgba(28,28,30,0.8)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', minHeight: '400px' }}>
            <h3>📈 Analytics</h3>
            <p style={{ color: '#8e8e93' }}>Chart will display here with {history.labels.length} data points</p>
            {history.labels.length > 0 && (
              <div style={{ height: '300px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
            {history.labels.length === 0 && (
              <p style={{ color: '#8e8e93' }}>Waiting for sensor data...</p>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div style={{ background: 'rgba(28,28,30,0.8)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
            <h3>💬 AI Assistant</h3>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', minHeight: '300px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
              {chatMessages.length === 0 ? (
                <p style={{ color: '#8e8e93', textAlign: 'center', paddingTop: '50px' }}>Start chatting with the AI!</p>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} style={{ marginBottom: '12px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    <div style={{
                      display: 'inline-block',
                      maxWidth: '70%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: msg.role === 'user' ? '#0a84ff' : 'rgba(255,255,255,0.1)',
                      wordWrap: 'break-word'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about your farm..."
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: '12px 20px',
                  background: '#0a84ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;