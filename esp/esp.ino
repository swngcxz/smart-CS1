#include <WiFi.h>
#include <Wire.h>
#include "HX711.h"
#include <HTTPClient.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// ================== WiFi Credentials ==================
const char* ssid = "ZTE_2.4G_3JyGtw";
const char* password = "4y7JrrGH";

// ================== Firebase Settings ==================
const String firebaseHost1 = "https://smartwaste-b3f0f-default-rtdb.firebaseio.com";
const String firebasePath1 = "/monitoring/bin1.json";  

const String firebaseHost2 = "https://smartbin-75fc3-default-rtdb.asia-southeast1.firebasedatabase.app";
const String firebasePath2 = "/monitoring/data.json";  

// ================== HX711 Load Cell ==================
#define DT1 33
#define SCK1 32
HX711 scale;

// ================== Ultrasonic Sensor ==================
#define TRIG_PIN 5
#define ECHO_PIN 4

// ================== Buzzer + LEDs ==================
#define BUZZER 21
#define GREEN_LED 18
#define RED_LED 19

// ================== GPS ==================
TinyGPSPlus gps;
HardwareSerial gpsSerial(1);
#define GPS_RX 16  
#define GPS_TX 17  

// ================== GPS Cache ==================
double lastLat = NAN;
double lastLng = NAN;
unsigned long lastFixMillis = 0;
unsigned long lastGPSTimeMillis = 0;
const unsigned long GPS_TIMEOUT = 30000; // 30 seconds timeout for GPS data

// ================== Calibration & Thresholds ==================
const float calibration_factor = -285159;
const float maxWeight = 2.5;
const int minDistance = 5;
const int maxDistance = 30;
const int alertThreshold = 85;
const long interval = 2000;  // 2s refresh

unsigned long previousMillis = 0;

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  // Scale
  scale.begin(DT1, SCK1);
  scale.set_scale(calibration_factor);
  scale.tare();

  // Pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);

  digitalWrite(BUZZER, LOW);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);

  // WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

// ================== Sensors ==================
float getStableWeight() {
  if (!scale.is_ready()) return 0;
  float sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += scale.get_units(1);
    delay(5);
  }
  return max(0.0f, sum / 5.0f);
}

int getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  int duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1;
  return duration * 0.034 / 2;
}

int getHeightPercent(int distance) {
  if (distance == -1) return -1;
  if (distance <= minDistance) return 100;
  if (distance >= maxDistance) return 0;
  return map(distance, maxDistance, minDistance, 0, 100);
}

// ================== Alerts ==================
void alertBuzzer() {
  digitalWrite(BUZZER, HIGH);
  delay(300);
  digitalWrite(BUZZER, LOW);
  delay(300);
}

// ================== GPS ==================
void updateGPS() {
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  if (gps.location.isValid()) {
    double newLat = gps.location.lat();
    double newLng = gps.location.lng();

    if (newLat != 0.0 && newLng != 0.0) { // avoid junk coordinates
      lastLat = newLat;
      lastLng = newLng;
      lastFixMillis = millis();
      lastGPSTimeMillis = millis(); // Update GPS time when we get fresh data
    }
  }
}

String getActiveAgo() {
  if (lastFixMillis == 0) return "Never";
  unsigned long diff = millis() - lastFixMillis;
  if (diff < 60000) return String(diff / 1000) + "s ago";
  else if (diff < 3600000) return String(diff / 60000) + "m ago";
  else if (diff < 86400000) return String(diff / 3600000) + "h ago";
  return String(diff / 86400000) + "d ago";
}

String getGPSTime() {
  if (gps.time.isValid() && gps.date.isValid()) {
    char buf[25];
    sprintf(buf, "%04d-%02d-%02d %02d:%02d:%02d",
            gps.date.year(), gps.date.month(), gps.date.day(),
            gps.time.hour(), gps.time.minute(), gps.time.second());
    return String(buf);
  }
  return "N/A";
}

String getCurrentTime() {
  // Get current time in local timezone (Philippines UTC+8)
  unsigned long currentMillis = millis();
  unsigned long seconds = currentMillis / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  
  // Calculate time since startup (simplified)
  unsigned long currentHour = (hours % 24);
  unsigned long currentMinute = minutes % 60;
  unsigned long currentSecond = seconds % 60;
  
  // Use a fixed date for now (2025-10-08)
  char buf[25];
  sprintf(buf, "2025-10-08 %02d:%02d:%02d",
          currentHour, currentMinute, currentSecond);
  return String(buf);
}

bool isGPSDataFresh() {
  if (lastGPSTimeMillis == 0) return false;
  return (millis() - lastGPSTimeMillis) < GPS_TIMEOUT;
}

bool isValidJSON(String json) {
  // Simple JSON validation - check for balanced braces
  int openBraces = 0;
  for (int i = 0; i < json.length(); i++) {
    if (json.charAt(i) == '{') openBraces++;
    else if (json.charAt(i) == '}') openBraces--;
  }
  return openBraces == 0;
}

// ================== Main Loop ==================
void loop() {
  updateGPS();

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    float weight = getStableWeight();
    float weightPercent = min((weight / maxWeight) * 100.0, 100.0);

    int distance = getDistance();
    int heightPercent = getHeightPercent(distance);

    float binLevel = (heightPercent == -1) ? weightPercent : (weightPercent + heightPercent) / 2.0;
    binLevel = constrain(binLevel, 0.0f, 100.0f);

    bool gps_valid = gps.location.isValid() && gps.location.lat() != 0.0 && gps.location.lng() != 0.0 && isGPSDataFresh();
    int satellites = gps.satellites.value();
    double latitude = (!isnan(lastLat)) ? lastLat : NAN;
    double longitude = (!isnan(lastLng)) ? lastLng : NAN;

    String gpsTimestamp = getGPSTime();
    String currentTime = getCurrentTime();
    String lastActive = getActiveAgo();

    // Debug
    Serial.println("========== BIN 1 ==========");
    Serial.printf("Level: %.0f%% \n", binLevel);
    Serial.printf("Weight: %.2fkg (%.0f%%)| Dist: %dcm (%d%%)\n", weight, weightPercent, distance, heightPercent);
    if (!isnan(latitude) && !isnan(longitude)) {
      Serial.printf("GPS: %.6f, %.6f [%s]\n", latitude, longitude, gps_valid ? "LIVE" : "CACHED");
    } else {
      Serial.println("GPS: No valid fix yet");
    }
    Serial.printf("Sat: %d | Last Fix: %s | GPS Time: %s\n", satellites, lastActive.c_str(), gpsTimestamp.c_str());
    Serial.println("===========================\n");

    // LEDs + Buzzer
    if (binLevel >= 90) {
      digitalWrite(RED_LED, HIGH);
      digitalWrite(GREEN_LED, LOW);
    } else {
      digitalWrite(RED_LED, LOW);
      digitalWrite(GREEN_LED, HIGH);
    }
    if (binLevel >= alertThreshold) alertBuzzer();

    // WiFi reconnect
    if (WiFi.status() != WL_CONNECTED) {
      WiFi.begin(ssid, password);
      Serial.println("Reconnecting WiFi...");
    }

    // Upload only when WiFi OK
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      
      // Build JSON payload using compact format (single line)
      String payload = "{";
      payload += "\"weight_kg\":" + String(weight, 3) + ",";
      payload += "\"weight_percent\":" + String((int)weightPercent) + ",";
      payload += "\"distance_cm\":" + String(distance) + ",";
      payload += "\"height_percent\":" + String((int)heightPercent) + ",";
      payload += "\"bin_level\":" + String((int)binLevel) + ",";
      
      // Always include latitude and longitude
      if (!isnan(lastLat) && !isnan(lastLng)) {
        payload += "\"latitude\":" + String(lastLat, 6) + ",";
        payload += "\"longitude\":" + String(lastLng, 6) + ",";
      } else {
        payload += "\"latitude\":0,";
        payload += "\"longitude\":0,";
      }
      
      // Use simple time format to avoid JSON issues
      String simpleTime = "2025-10-08 01:00:00";
      
      payload += "\"last_active\":\"" + simpleTime + "\",";
      payload += "\"gps_valid\":" + String(gps_valid ? "true" : "false") + ",";
      payload += "\"satellites\":" + String(satellites) + ",";
      payload += "\"gps_timestamp\":\"" + simpleTime + "\",";
      payload += "\"coordinates_source\":\"" + String(gps_valid ? "gps_live" : "gps_backup") + "\",";
      payload += "\"timestamp\":" + String(millis()) + ",";
      payload += "\"gps_timeout\":" + String(isGPSDataFresh() ? "false" : "true") + "";
      payload += "}";
      
      // Debug: Print payload for troubleshooting
      Serial.println("Payload:");
      Serial.println(payload);
      
      // Validate JSON before sending
      if (!isValidJSON(payload)) {
        Serial.println("ERROR: Invalid JSON payload!");
        return;
      }

      // Firebase 1
      http.begin(firebaseHost1 + firebasePath1);
      http.addHeader("Content-Type", "application/json");
      int httpCode1 = http.PUT(payload);
      Serial.print("Firebase 1 Response: ");
      Serial.println(httpCode1);
      if (httpCode1 != 200) {
        Serial.println("Firebase 1 Error: " + http.getString());
      }
      http.end();

      // Firebase 2
      http.begin(firebaseHost2 + firebasePath2);
      http.addHeader("Content-Type", "application/json");
      int httpCode2 = http.PUT(payload);
      Serial.print("Firebase 2 Response: ");
      Serial.println(httpCode2);
      if (httpCode2 != 200) {
        Serial.println("Firebase 2 Error: " + http.getString());
      }
      http.end();
    }
  }

  // Manual tare
  if (Serial.available()) {
    if (Serial.read() == 't') {
      scale.tare();
      Serial.println("Tare set!");
    }
  }
}
