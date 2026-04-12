# Smart Farm System Diagnostics

## 🔗 How to Check if Everything is Linked

### 1. Check Firebase Connection
**Open your website:** https://smart-farm-ui-phi.vercel.app

Press **F12** to open browser Developer Tools

Go to **Console** tab

You should see these messages:
```
🔥 Firebase Initializing with projectId: smart-farm-30213
✅ Firebase initialized successfully!
```

✅ If you see these = **Firebase is connected!**

---

### 2. Check ESP32 Connection
**Requirements:**
- ESP32 must be running (powered on)
- ESP32 must be connected to WiFi: `youseff`
- Must have uploaded the latest firmware

**Signs ESP32 is Connected:**
- Go to website Dashboard tab
- Look at the 4 sensor cards:
  - Temperature (should show a number, not 0)
  - Humidity (should show a number)
  - Soil Moisture (should show a percentage)
  - Light Level (should show a percentage)

✅ If all show real numbers = **ESP32 is sending data!**

---

### 3. Test Manual Controls (Verify 2-way Communication)

**Step 1:** Go to Dashboard tab
**Step 2:** Click **"Switch to Manual"** button
**Step 3:** Try clicking one device button (e.g., "Tungsten Lamp")
**Step 4:** Open ESP32 Serial Monitor

You should see:
```
>>> Mode changed to: MANUAL
Tungsten: ON
```

✅ If you see this = **ESP32 is receiving commands!**

---

## 📊 System Connection Diagram

```
     ESP32                    Firebase                    Website
  (Wemos S2)              (Real-time DB)              (Vercel/React)
     |                         |                           |
     | sends sensor data       |                           |
     |------>         /live_sensors/          <-----------|
     |                {temp: 25, ...}         listens for
     |                                        sensor updates
     |                                                      |
     | reads commands          |                           |
     |<------         /controls/             <-----------|
     |            {mode: MANUAL}              writes commands
     |
  PIN 3,4,5,11,12,14,16,18,21
  control relays & sensors

```

---

## 🧪 Full System Test

### Test 1: Firebase Connected?
```
1. Open: https://smart-farm-ui-phi.vercel.app
2. F12 → Console
3. Look for ✅ message
Result: ✅ or ❌
```

### Test 2: ESP32 Sending Data?
```
1. Website → Dashboard tab
2. Check if sensor values are changing
3. Refresh page, check Console for errors
Result: ✅ or ❌
```

### Test 3: Website Controlling ESP32?
```
1. Website → Dashboard → Switch to MANUAL
2. Click "Tungsten Lamp" button
3. ESP32 Serial Monitor → should show "Tungsten: ON"
4. Relay Pin 11 should activate
Result: ✅ or ❌
```

### Test 4: Auto Mode Working?
```
1. Website → Dashboard → Switch to AUTO
2. Cover the light sensor (block light)
3. Within 2 seconds, LED should turn ON
4. Check ESP Console: "DIM LIGHT: LEDs ON"
Result: ✅ or ❌
```

---

## ❌ Troubleshooting

### No sensor data on website?
```
Check:
□ ESP32 is powered ON
□ ESP32 is connected to WiFi "youseff"
□ Open ESP32 Serial Monitor (115200 baud)
□ You should see sensor readings every 2 seconds
□ Check Website Console for Firebase errors
```

### Manual controls don't work?
```
Check:
□ ESP32 Serial Monitor shows "Mode changed to: MANUAL"
□ Check pins 11,12,14,16,18,21 are connected to relays
□ Website Console shows no errors
□ Firebase Database has /controls/ path
```

### Still not working?
```
1. Check Firebase Console:
   https://console.firebase.google.com
   
2. Go to: smart-farm-30213 → Realtime Database
   
3. You should see:
   {
     "live_sensors": { "temp": 25.3, ... },
     "controls": { "mode": "AUTO", ... }
   }
   
4. If paths are missing → ESP32 never sent data
```

---

## 📡 Live Monitoring

### Real-time Check (While On Website)
1. Go to Firebase Console
2. Select: smart-farm-30213 → Realtime Database
3. Watch `/live_sensors/` path
4. Values should update every 2 seconds when ESP32 is online

### ESP32 Logs
```
Open Serial Monitor (9600 or 115200 baud):
- Temperature: 25.3°C  (updates every 2 seconds)
- Humidity: 65%
- Soil: 45%
- Light: 72%
- WiFi: CONNECTED
- Mode: AUTO (or MANUAL)
```

---

## ✅ System is Fully Linked When:

- ✅ Website shows "Firebase initialized successfully"
- ✅ Dashboard shows real sensor values (not all zeros)
- ✅ Sensor values change every 2-5 seconds
- ✅ Clicking manual controls changes ESP32 relay state
- ✅ AUTO mode automatically controls devices based on sensors
- ✅ Firebase Database shows /live_sensors/ updating in real-time

---

**Status Summary:**

| Component | Linked? | Evidence |
|-----------|---------|----------|
| Website → Firebase | ? | Check Console for ✅ message |
| Firebase → ESP32 (sensors) | ? | Check Dashboard for sensor values |
| Website → ESP32 (controls) | ? | Check Manual mode controls work |
| Full System | ? | All three working = ✅ |

