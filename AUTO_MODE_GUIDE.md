# Smart Farm AUTO Mode - Complete Guide

## 🤖 AUTO Mode Settings (Updated for Professional Cultivation)

Your ESP32 now runs intelligent automatic controls based on precise environmental thresholds optimized for mushroom/crop cultivation.

---

## 📊 Control Thresholds

### 1. 🌡️ Temperature Control (DHT11 Sensor)

| Condition | Threshold | Action | Purpose |
|-----------|-----------|--------|---------|
| **Optimal Range** | 18°C - 22°C | No heating/cooling | Promotes photosynthesis & fruiting |
| **Low Temperature** | **< 18°C** | ✅ **Tungsten Lamp ON** | Provides radiant heat to crop area |
| **High Temperature** | **> 22°C** | ✅ **Fan ON** | Expels hot air, forces circulation |

**Serial Output Examples:**
```
🔥 LOW TEMP (15.2°C): Tungsten Heater ON, Fan OFF
✓ OPTIMAL TEMP (20.1°C): Both OFF
❄️ HIGH TEMP (24.5°C): Tungsten Heater OFF, Fan ON
```

---

### 2. 💧 Atmospheric Humidity (DHT11 Sensor)

| Condition | Threshold | Action | Purpose |
|-----------|-----------|--------|---------|
| **Optimal Range** | 85% - 90% | Maintain balance | Prevents fungal/bacterial issues |
| **Low Humidity** | **< 85%** | ✅ **Pump ON** | Introduces water → evaporates → raises humidity |
| **High Humidity** | **> 90%** | ✅ **Fan ON** | Extracts moisture-dense air |

**Serial Output Examples:**
```
💧 LOW HUMIDITY (78.3%): Pump ON
✓ OPTIMAL HUMIDITY (87.5%)
💨 HIGH HUMIDITY (92.1%): Fan ON
```

**Note:** Humidity is monitored but Pump is primarily controlled by Soil Moisture (see below).

---

### 3. 🌱 Substrate Moisture (Soil Sensor - Analog)

| Condition | Threshold | Action | Purpose |
|-----------|-----------|--------|---------|
| **Optimal Range** | 60% - 80% | Auto-maintain | Perfect for mycelium/root growth |
| **Dry Soil** | **< 60%** | ✅ **Pump ON** | Irrigate substrate with precision |
| **Wet Soil** | **> 80%** | ✅ **Pump STAYS OFF** | Rely on natural evaporation |

**Serial Output Examples:**
```
🌱 DRY SOIL (45%): Pump ON for irrigation
✓ OPTIMAL SOIL (70%): Maintaining
⚠️ WET SOIL (85%): Pump OFF (rely on evaporation)
```

**Key Advantage:** Prevents root rot while ensuring adequate water availability.

---

### 4. 💡 Ambient Illumination (Light Sensor - LDR)

| Condition | Threshold | Action | Purpose |
|-----------|-----------|--------|---------|
| **Dim Light** | **< 40%** | ✅ **All 3 LEDs ON** | Supplies photosynthetic light |
| **Bright Light / Night** | **≥ 40%** | ✅ **All 3 LEDs OFF** | Respects natural photoperiod |

**Serial Output Examples:**
```
💡 DIM LIGHT (32%): All LEDs ON
🌞 BRIGHT LIGHT (65%): All LEDs OFF
```

**LED Array:**
- White LED (full spectrum)
- Blue LED (vegetative growth)
- Red LED (flowering/fruiting)

---

## 🎛️ Hardware Overview

### Controlled Devices in AUTO Mode

```
ESP32 WEMOS S2 MINI
│
├─ Temperature Sensor (DHT11)
│  └─> If T < 18°C → Pin 11 = Tungsten Lamp ON
│  └─> If T > 22°C → Pin 21 = Fan ON
│
├─ Humidity Sensor (DHT11 in DHT)
│  └─> If RH < 85% → Pin 18 = Pump ON (secondary)
│  └─> If RH > 90% → Pin 21 = Fan ON (secondary)
│
├─ Soil Moisture Sensor (Pin 3)
│  └─> If Soil% < 60% → Pin 18 = Pump ON (PRIMARY)
│  └─> If Soil% > 80% → Pin 18 = Pump OFF
│
└─ Light Sensor / LDR (Pin 5)
   └─> If Light < 40% → Pins 12,14,16 = LEDs ON
   └─> If Light ≥ 40% → Pins 12,14,16 = LEDs OFF
```

---

## 🚀 Website Control

### Dashboard Tab

When **AUTO Mode is Active:**
- ✅ All sensor readings update in real-time
- ✅ Charts show historical trends
- 🔒 Hardware buttons are **DISABLED** (grayed out)
- 📌 Message: "Controls are managed automatically by the system."

When **MANUAL Mode is Active:**
- ✅ All sensor readings update in real-time
- ⚡ Hardware buttons are **ENABLED**
- 🎚️ Click any button to directly control devices
- ⚠️ AUTO logic is **bypassed** - you have full control

### How to Switch Modes

**From AUTO → MANUAL:**
1. Click the blue **"Switch to Manual"** button
2. Hardware control buttons become enabled
3. ESP32 stops auto-logic, waits for your commands
4. Serial Monitor shows: `>>> Mode changed to: MANUAL`

**From MANUAL → AUTO:**
1. Click the grey **"Switch to Auto"** button
2. Hardware control buttons become disabled
3. ESP32 resumes intelligent auto-control
4. Serial Monitor shows: `>>> Mode changed to: AUTO`

---

## 📱 Real-Time Monitoring

### Console Output Every 2 Seconds (AUTO Mode)

```
--- Auto Mode Logic ---
🔥 LOW TEMP (17.8°C): Tungsten Heater ON, Fan OFF
💧 LOW HUMIDITY (81.2%): Pump ON
🌱 DRY SOIL (45%): Pump ON for irrigation
💡 DIM LIGHT (28%): All LEDs ON
```

### Control Decisions

The ESP32 makes **independent decisions** for each device:

1. **Temperature** decides: Tungsten Lamp OR Fan
2. **Humidity** decides: Fan (if RH > 90%)
3. **Soil Moisture** decides: Pump (PRIMARY)
4. **Light Level** decides: All LEDs

**Note:** Pump's primary controller is Soil Moisture, but it also responds to low humidity.

---

## ✅ System Verification Checklist

### Test AUTO Mode
```
1. [ ] Set website to AUTO mode
2. [ ] Open ESP32 Serial Monitor (115200 baud)
3. [ ] Monitor reads should show auto-control decisions every 2 seconds
4. [ ] Temperature < 18°C → See "Tungsten Heater ON"
5. [ ] Soil < 60% → See "Pump ON for irrigation"
6. [ ] Light < 40% → See "All LEDs ON"
7. [ ] Hardware buttons should be DISABLED (grayed out)
```

### Test MANUAL Mode
```
1. [ ] Set website to MANUAL mode
2. [ ] Hardware buttons become ENABLED (clickable)
3. [ ] Click "Tungsten Lamp" → ESP32 shows "Tungsten: ON"
4. [ ] Click "Water Pump" → ESP32 shows "Water Pump: ON"
5. [ ] Click "Ventilation Fans" → Pin 21 activates
6. [ ] Serial Monitor should show manual commands, not auto-logic
```

### Firebase Verification
```
1. [ ] Website → Open DevTools (F12) → Console
2. [ ] Should see: "✅ Firebase initialized successfully!"
3. [ ] Firebase console → smart-farm-30213 → Realtime Database
4. [ ] Should show:
     {
       "live_sensors": {
         "temp": 20.5,
         "humidity": 87.3,
         "moisture": 65,
         "light": 35
       },
       "controls": {
         "mode": "AUTO",
         "tungsten": false,
         "waterPump": false,
         "fans": false,
         ...
       }
     }
```

---

## 🔧 Troubleshooting

### AUTO Mode Not Working
**Problem:** Buttons are disabled but nothing's happening
- Check: Is ESP32 powered ON?
- Check: Is it connected to WiFi?
- Check: Serial Monitor shows sensor readings?
- Solution: Restart ESP32, verify WiFi credentials

### MANUAL Mode Not Working
**Problem:** Buttons are enabled but don't control devices
- Check: Are the relays wired correctly?
- Check: Does ESP32 have 5V power for relays?
- Check: Serial Monitor shows "Mode changed to: MANUAL"?
- Solution: Verify relay connections to GPIO pins 11, 12, 14, 16, 18, 21

### Thresholds Not Being Met
**Problem:** Temperature is 17°C but heater didn't turn on
- Check: Serial Monitor shows sensor value updates?
- Check: AUTO mode message appears?
- Check: Is DHT11 sensor working (no [DHT ERROR])?
- Solution: Calibrate DHT11 sensor, verify pin 4 connection

### Website Shows No Sensor Data
**Problem:** Dashboard is blank or all zeros
- Check: Website Console (F12) for Firebase errors
- Check: ESP32 Serial Monitor - are sensors being read?
- Check: Firebase Realtime Database has `/live_sensors/` path?
- Solution: See DIAGNOSTICS.md file

---

## 📗 Quick Reference

| Mode | Control Buttons | AUTO Logic | Use Case |
|------|-----------------|-----------|----------|
| **AUTO** | 🔒 Disabled | ✅ Running | Normal operation - hands off |
| **MANUAL** | ⚡ Enabled | ❌ Stopped | Emergency override or testing |

---

## 🌱 Crop-Specific Notes

### For Growing Mushrooms (Oyster, Lion's Mane, etc.)
- ✅ 18-22°C is perfect for fruiting
- ✅ High humidity (85-90%) prevents dehydration
- ✅ LEDs less critical (mushrooms don't need light)
- ⚠️ Keep pump active 60-80% to maintain substrate moisture

### For Growing Lettuce/Microgreens
- ✅ 18-22°C promotes leaf growth
- ✅ 85-90% humidity reduces transpiration stress
- ✅ LEDs critical - 12-16 hour photoperiod
- ⚠️ Soil moisture 60-80% ensures root health

---

**Last Updated:** April 12, 2026  
**Status:** ✅ AUTO Mode Active and Deployed
