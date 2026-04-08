import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, set } from 'firebase/database';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend
} from 'chart.js';

const apiBaseUrl = "https://unwitting-yong-aerogenically.ngrok-free.dev/v1";
const apiKey = "lm-studio";
const modelName = "llama-2-7b-chat"; // Update if your LM Studio model uses a different name

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  // ADDED: humidity to the sensor state
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

  // ADDED: humidity and moisture to history tracking
  const [history, setHistory] = useState({
    labels: [], temp: [], humidity: [], moisture: [], light: []
  });

  // AI Chat state
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
          const newHumidity = [...prev.humidity, data.humidity || 0].slice(-15); // Air Humidity
          const newMoisture = [...prev.moisture, data.moisture || 0].slice(-15); // Soil Moisture
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
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiText = data?.choices?.[0]?.message?.content || 'No response text available.';
      const aiMessage = { role: 'assistant', content: aiText };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please check your connection and try again.' };
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
          <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
            Analytics
          </button>
          <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>
            AI Chat
          </button>
        </div>
      </header>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="tab-content fade-in">
          
          {/* NOW 4 CARDS */}
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
              <button className={`apple-btn red ${controls.redLED ? 'active' : ''}`} disabled={controls.mode === 'AUTO'} onClick={() => toggleHardware('redLED')}>Red LED</button>
              <button className={`apple-btn pump ${controls.waterPump ? 'active' : ''}`} disabled={controls.mode === 'AUTO'} onClick={() => toggleHardware('waterPump')}>Water Pump</button>
              <button className={`apple-btn fan ${controls.fans ? 'active' : ''}`} disabled={controls.mode === 'AUTO'} onClick={() => toggleHardware('fans')}>Ventilation Fans</button>
            </div>

            {controls.mode === 'AUTO' && (
              <p className="lock-text">Controls are managed automatically by the system.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="tab-content fade-in">
          <div className="apple-card chart-container">
            <h3>Live Environment History</h3>
            <div className="chart-wrapper">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI CHAT */}
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

    </div>
  );
}

export default App;