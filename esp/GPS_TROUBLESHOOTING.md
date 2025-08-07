# GPS Module Troubleshooting Guide

## 🔧 Hardware Setup

### GPS Module Pinout (NEO-6M/NEO-8M)
```
┌─────────────────┐
│   GPS Module    │
├─────────────────┤
│ VCC  → 3.3V     │
│ GND  → GND      │
│ TX   → GPIO 16  │ (ESP32 RX)
│ RX   → GPIO 17  │ (ESP32 TX)
└─────────────────┘
```

### ESP32 Wiring
```
ESP32 Pin    GPS Module    Description
─────────    ──────────    ───────────
3.3V    →    VCC          Power supply
GND     →    GND          Ground
GPIO 16 →    TX           GPS TX to ESP32 RX
GPIO 17 →    RX           GPS RX to ESP32 TX (optional)
```

## 🔍 Common Issues & Solutions

### 1. No GPS Data Received

**Symptoms:**
- Serial shows "No GPS detected"
- No characters processed
- GPS Valid: No

**Solutions:**
1. **Check Wiring:**
   - Ensure VCC is connected to 3.3V (NOT 5V)
   - Verify GND connection
   - Check TX/RX connections (TX from GPS → RX on ESP32)

2. **Check GPS Module:**
   - Look for power LED on GPS module
   - Check if GPS module has antenna connected
   - Try different GPS module if available

3. **Test with Simple Code:**
```cpp
#include <HardwareSerial.h>

HardwareSerial gpsSerial(1);

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);
  Serial.println("GPS Test Starting...");
}

void loop() {
  if (gpsSerial.available()) {
    char c = gpsSerial.read();
    Serial.print(c);
  }
}
```

### 2. GPS Receiving Data But No Fix

**Symptoms:**
- Characters being processed
- Sentences with fix: 0
- GPS Valid: No

**Solutions:**
1. **Move Outdoors:**
   - GPS needs clear view of sky
   - Avoid buildings, trees, metal objects
   - First fix can take 1-5 minutes

2. **Check Antenna:**
   - Ensure GPS antenna is connected
   - Try external antenna if available
   - Position antenna facing sky

3. **Wait Longer:**
   - Cold start can take 30 seconds to 5 minutes
   - Warm start: 1-30 seconds
   - Hot start: 1-3 seconds

### 3. Incorrect Coordinates

**Symptoms:**
- GPS Valid: Yes but wrong location
- Coordinates don't match actual location

**Solutions:**
1. **Check GPS Module Type:**
   - NEO-6M: Good accuracy
   - NEO-8M: Better accuracy
   - Some modules need configuration

2. **Verify Coordinates:**
   - Use Google Maps to verify coordinates
   - Check if coordinates are in correct format
   - Ensure GPS module is properly calibrated

## 🛠️ Debugging Commands

### Manual Commands (via Serial Monitor):
- `g` or `G` - Show GPS status
- `d` or `D` - Show raw GPS data for 10 seconds
- `t` or `T` - Tare scale
- `r` or `R` - Reconnect WiFi
- `s` or `S` - Show Firebase URLs

### Expected Serial Output:
```
Smart Bin System Starting...
Initializing GPS...
Testing GPS serial communication...
✅ GPS serial is receiving data
Scale initialized and tared
WiFi Connected!
Setup complete. GPS will take 1-5 minutes to get first fix outdoors.

=== GPS DEBUG INFO ===
GPS Running Time: 30 seconds
GPS Initialized: Yes
Chars Processed: 1250
Sentences with Fix: 15
Failed Checksums: 0
Location Valid: Yes
Latitude: 10.210500
Longitude: 123.758300
Altitude: 15.20 meters
Course: 0.00 degrees
Speed: 0.00 km/h
Date: 15/01/24
Time: 14:30:25
=====================
```

## 📊 GPS Data Format

### NMEA Sentences (Raw GPS Data):
```
$GPRMC,143025.000,A,1012.6300,N,12345.4980,E,0.00,0.00,150124,,,A*6C
$GPGGA,143025.000,1012.6300,N,12345.4980,E,1,08,1.2,15.2,M,0.0,M,,*6F
$GPGSV,3,1,12,01,05,040,30,02,30,308,27,03,23,230,21,04,12,131,19*7A
```

### What Each Sentence Means:
- `$GPRMC` - Recommended Minimum sentence
- `$GPGGA` - Global Positioning System Fix Data
- `$GPGSV` - GPS Satellites in View

## 🔧 Advanced Troubleshooting

### 1. GPS Module Configuration
Some GPS modules need configuration. Try sending these commands:

```cpp
// Set update rate to 1Hz
gpsSerial.println("$PMTK220,1000*1F");

// Set NMEA output to RMC and GGA only
gpsSerial.println("$PMTK314,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*28");

// Enable SBAS (Satellite Based Augmentation System)
gpsSerial.println("$PMTK313,1*2E");
```

### 2. Power Issues
- GPS modules need stable 3.3V power
- Add 100-470μF capacitor between VCC and GND
- Ensure adequate current supply (50-100mA)

### 3. Antenna Issues
- Use active antenna for better reception
- Position antenna away from metal objects
- Ensure antenna has clear view of sky

### 4. Software Issues
- Check TinyGPS++ library version
- Ensure correct baud rate (9600 for most modules)
- Verify serial port configuration

## 📱 Testing with Mobile Apps

### GPS Test Apps:
1. **GPS Test** (Android)
2. **GPS Status** (Android)
3. **GPS Coordinates** (iOS)

### Compare Results:
- Use mobile app to get current coordinates
- Compare with ESP32 GPS readings
- Check accuracy and consistency

## 🎯 Quick Fix Checklist

- [ ] GPS module powered (3.3V)
- [ ] GND connected
- [ ] TX from GPS → RX on ESP32 (GPIO 16)
- [ ] Antenna connected and positioned
- [ ] Testing outdoors with clear sky view
- [ ] Waiting 1-5 minutes for first fix
- [ ] Using correct baud rate (9600)
- [ ] No metal objects blocking signal

## 📞 Still Having Issues?

If GPS still doesn't work after trying all solutions:

1. **Try Different GPS Module:**
   - NEO-6M → NEO-8M
   - Different manufacturer
   - Different antenna

2. **Check Environment:**
   - Urban areas have poor GPS reception
   - Indoor testing won't work
   - Metal buildings block signals

3. **Verify Hardware:**
   - Use multimeter to check connections
   - Test GPS module with Arduino Uno
   - Check for damaged components

4. **Software Alternatives:**
   - Use WiFi-based location services
   - Implement manual coordinate input
   - Use cellular triangulation 