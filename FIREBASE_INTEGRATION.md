# Smart Farm Website - Firebase Integration

## 🔗 Connection Overview

The React website connects to Firebase Realtime Database to:
- **Read** live sensor data from ESP32
- **Write** control commands to ESP32
- **Display** real-time dashboards and historical data

## 📊 Website Structure

```
src/
├── firebase.js          ← Firebase configuration & exports
├── App.jsx             ← Main component (dashboard, controls, chat)
├── main.jsx            ← React entry point
├── index.css           ← Styling
└── index.html          ← HTML template
```

## 🔐 Firebase Configuration

File: `src/firebase.js`

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDDXolRq3i7dGuXYtfzM4iF-QJD-JJ4Si0",
  authDomain: "smart-farm-30213.firebaseapp.com",
  databaseURL: "https://smart-farm-30213-default-rtdb.firebaseio.com",
  projectId: "smart-farm-30213",
  storageBucket: "smart-farm-30213.firebasestorage.app",
  messagingSenderId: "459244704750",
  appId: "1:459244704750:web:fd577bef214938e757b4ff"
};
```

## 📱 React App Features

### 1. Dashboard Tab
- **Temperature gauge** with live updates
- **Humidity percentage** 
- **Soil moisture level** with visual indicator
- **Light intensity** chart
- **Historical graphs** (Chart.js) tracking last 15 readings

### 2. Controls Tab
- **Mode toggle**: AUTO ↔ MANUAL
  - **AUTO**: Uses ESP32 internal logic
  - **MANUAL**: Direct control from website

- **Manual Controls** (only active in MANUAL mode):
  - Tungsten Heater toggle
  - LED controls (White, Blue, Red)
  - Water Pump toggle
  - Fan toggle

### 3. AI Chat Tab
- Connected to local LM Studio (llama-2-7b-chat)
- Provides plant care recommendations
- API: `https://unwitting-yong-aerogenically.ngrok-free.dev/v1`

## 🔄 Real-time Data Flow

### Reading Sensor Data:
```javascript
const sensorRef = ref(db, 'live_sensors');
onValue(sensorRef, (snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.val();
    setSensors(data);  // Updates UI immediately
  }
});
```

### Sending Control Commands:
```javascript
const toggleHardware = (key) => {
  const newValue = !controls[key];
  set(ref(db, `controls/${key}`), newValue);
  // Change propagates to ESP32 instantly
};
```

## 📥 Data Structure Sync

### What the Website Listens To:
```
/live_sensors
├── temp (from DHT11)
├── humidity (from DHT11)
├── moisture (from Soil sensor 0-100)
└── light (from Light sensor 0-100)
```

### What the Website Controls:
```
/controls
├── mode ("AUTO" or "MANUAL")
├── tungsten (boolean)
├── whiteLED (boolean)
├── blueLED (boolean)
├── redLED (boolean)
├── waterPump (boolean)
└── fans (boolean)
```

## 🚀 Running the Website

### Development Mode:
```bash
cd c:\Users\Lenovo\Documents\GitHub\smart-farm-ui
npm install
npm run dev
```

### Production Build:
```bash
npm run build
npm run preview
```

## 📊 UI State Management

```javascript
// Sensor readings (real-time from Firebase)
const [sensors, setSensors] = useState({ 
  temp: 0, 
  humidity: 0, 
  moisture: 0, 
  light: 0 
});

// Control states (synchronized with Firebase)
const [controls, setControls] = useState({
  mode: 'AUTO',
  tungsten: false,
  whiteLED: false,
  blueLED: false,
  redLED: false,
  waterPump: false,
  fans: false
});

// Historical data for charts
const [history, setHistory] = useState({
  labels: [],
  temp: [],
  humidity: [],
  moisture: [],
  light: []
});
```

## 🔔 Real-time Updates

### Update Interval:
- **Sensor data**: ESP32 sends every 2 seconds
- **Website display**: Updates instantly via Firebase listeners
- **Control commands**: Applied immediately (ESP32 checks every 3 seconds)

### Chart History:
- Last **15 readings** displayed on graphs
- Auto-scrolls to show latest data
- Time labels: HH:MM:SS format

## 🎨 UI Tabs

### Tabs Structure:
```jsx
{activeTab === 'dashboard' && <Dashboard />}
{activeTab === 'controls' && <Controls />}
{activeTab === 'chat' && <ChatInterface />}
```

### Tab Navigation:
Click buttons to switch between:
- 📊 **Dashboard** - View sensors & history
- ⚙️ **Controls** - Manage devices
- 💬 **Chat** - AI assistance

## ⚠️ Important Notes

### Dependency: LM Studio
The chat feature requires LM Studio running locally on the same network:
- Model: `llama-2-7b-chat`
- Endpoint: `http://localhost:1234/v1/chat/completions`
- Current config uses ngrok tunnel (may need updating)

### Firebase Realtime Limits
- Free tier: Check Firebase console for usage
- Concurrent connections: Limited on free tier
- Data storage: Keep historical data trimmed

### Network Requirements
- Website and ESP32 must be on **same WiFi network**
- Both need internet access to Firebase
- Low latency recommended for real-time feel

## 🔐 Security Considerations

### Current Setup:
- ⚠️ **Open Firebase rules** - Anyone can read/write
- ⚠️ **API credentials in code** - Visible to all users

### Recommendations for Production:
1. Implement Firebase Authentication
2. Add role-based access control (Admin users only)
3. Move API keys to backend environment variables
4. Use Firebase Security Rules:
```json
{
  "rules": {
    "live_sensors": {
      ".read": true,
      ".write": "root.child('isAdmin').child(auth.uid).val() === true"
    },
    "controls": {
      ".read": true,
      ".write": "root.child('isAdmin').child(auth.uid).val() === true"
    }
  }
}
```

## 📡 Debugging

### Check Firebase Connection:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for Firebase errors

### Monitor Data Updates:
1. Open Firebase Console
2. Go to Realtime Database
3. Watch `/live_sensors` and `/controls` paths

### Test Manual Controls:
1. Switch to MANUAL mode
2. Toggle a device
3. Check ESP32 Serial Monitor for confirmation

---

**Integration Status**: ✅ Complete & Operational
