#include <WiFi.h>
#include <Wire.h>
#include "HX711.h"
#include <HTTPClient.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// WiFi Credentials
const char* ssid = "ZTE_2.4G_3JyGtw";
const char* password = "4y7JrrGH";

// Firebase Settings
const String firebaseHost1 = "https://smartwaste-b3f0f-default-rtdb.firebaseio.com/";
const String firebasePath1 = "/monitoring/bin1.json";  
const String firebaseHost2 = "https://smartbin-75fc3-default-rtdb.asia-southeast1.firebasedatabase.app";
const String firebasePath2 = "/monitoring/data.json";  

// HX711 Load Cell
#define DT1 33
#define SCK1 32
HX711 scale;

// Ultrasonic Sensor
#define TRIG_PIN 5
#define ECHO_PIN 4

// Buzzer
#define BUZZER 21

// LED Indicators
#define GREEN_LED 18
#define RED_LED 19

// GPS
TinyGPSPlus gps;
HardwareSerial gpsSerial(1);  
#define GPS_RX 16  
#define GPS_TX 17  

// GPS Cache Variables
double lastLat = 0.0;
double lastLng = 0.0;
unsigned long lastFixMillis = 0;

// Calibration and Thresholds
const float calibration_factor = -285159;
const float maxWeight = 2.5;  
const int minDistance = 5;
const int maxDistance = 30;
const int alertThreshold = 85;
const long interval = 2000;  // 2s refresh

unsigned long previousMillis = 0;

void setup() {
  Serial.begin(115200);

  // GPS Serial
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

void alertBuzzer() {
  digitalWrite(BUZZER, HIGH);
  delay(300);
  digitalWrite(BUZZER, LOW);
  delay(300);
}

// Update GPS cache with latest valid coordinates
void updateGPS() {
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }
  if (gps.location.isValid()) {
    lastLat = gps.location.lat();
    lastLng = gps.location.lng();
    lastFixMillis = millis();
  }
}

// Get human-readable time since last GPS fix
String getActiveAgo() {
  unsigned long diff = millis() - lastFixMillis;
  if (lastFixMillis == 0) return "Never";
  if (diff < 60000) return String(diff / 1000) + "s ago";
  else if (diff < 3600000) return String(diff / 60000) + "m ago";
  else if (diff < 86400000) return String(diff / 3600000) + "h ago";
  else return String(diff / 86400000) + "d ago";
}

// Get GPS timestamp if available
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

    // GPS Values (fallback safe)
    double latitude = lastLat;
    double longitude = lastLng;
    bool gps_valid = gps.location.isValid();
    int satellites = gps.satellites.value();

    // Timestamps
    String gpsTimestamp = getGPSTime();
    String lastActive = getActiveAgo();

    // === Compact Serial Debug ===
    Serial.println("========== BIN 1 ==========");
    Serial.printf("Weight: %.2fkg (%.0f%%)\n", weight, weightPercent);
    Serial.printf("Level: %.0f%% | Dist: %dcm (%d%%)\n", binLevel, distance, heightPercent);
    Serial.printf("GPS: %.6f, %.6f [%s]\n", latitude, longitude, gps_valid ? "LIVE" : "CACHED");
    Serial.printf("Sat: %d | Valid: %s\n", satellites, gps_valid ? "YES" : "NO");
    Serial.printf("Last Fix: %s | GPS Time: %s\n", lastActive.c_str(), gpsTimestamp.c_str());
    Serial.println("===========================\n");

    // LED Indicators
    if (binLevel >= 90) {
      digitalWrite(RED_LED, HIGH);
      digitalWrite(GREEN_LED, LOW);
    } else {
      digitalWrite(RED_LED, LOW);
      digitalWrite(GREEN_LED, HIGH);
    }

    if (binLevel >= alertThreshold) alertBuzzer();

    // WiFi Reconnect
    if (WiFi.status() != WL_CONNECTED) {
      WiFi.begin(ssid, password);
      Serial.println("Reconnecting WiFi...");
    }

    // Firebase Upload (always sends last known coords)
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;

      String payload = "{";
      payload += "\"weight_kg\":" + String(weight, 3) + ",";
      payload += "\"weight_percent\":" + String((int)weightPercent) + ",";
      payload += "\"distance_cm\":" + String(distance) + ",";
      payload += "\"height_percent\":" + String((int)heightPercent) + ",";
      payload += "\"bin_level\":" + String((int)binLevel) + ",";
      payload += "\"latitude\":" + String(latitude, 6) + ",";
      payload += "\"longitude\":" + String(longitude, 6) + ",";
      payload += "\"gps_valid\":" + String(gps_valid ? "true" : "false") + ",";
      payload += "\"satellites\":" + String(satellites) + ",";
      payload += "\"gps_timestamp\":\"" + gpsTimestamp + "\",";
      payload += "\"last_active\":\"" + lastActive + "\",";
      payload += "\"coordinates_source\":\"" + String(gps_valid ? "gps_live" : "gps_cached") + "\"";
      payload += "}";

      // Firebase 1
      http.begin(firebaseHost1 + firebasePath1);
      http.addHeader("Content-Type", "application/json");
      int httpCode1 = http.PUT(payload);
      Serial.print("Firebase 1 Response: ");
      Serial.println(httpCode1);
      http.end();

      // Firebase 2
      http.begin(firebaseHost2 + firebasePath2);
      http.addHeader("Content-Type", "application/json");
      int httpCode2 = http.PUT(payload);
      Serial.print("Firebase 2 Response: ");
      Serial.println(httpCode2);
      http.end();
    }
  }

  // Manual Tare
  if (Serial.available()) {
    if (Serial.read() == 't') {
      scale.tare();
      Serial.println("Tare set!");
    }
  }
}
