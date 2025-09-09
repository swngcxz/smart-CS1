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
const String firebaseHost1 = "https://smartbin-841a3-default-rtdb.firebaseio.com/";
const String firebasePath1 = "/monitoring/bin1.json";  // ✅ Fixed location to update
const String firebaseHost2 = "https://smartbin-75fc3-default-rtdb.asia-southeast1.firebasedatabase.app";
const String firebasePath2 = "/monitoring/data.json";  // 🟡 Still using PUT

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
HardwareSerial gpsSerial(1);  // Use UART1
#define GPS_RX 16  // GPS TX → ESP32 RX
#define GPS_TX 17  // GPS RX → ESP32 TX

// Calibration and Thresholds
const float calibration_factor = -285159;
const float maxWeight = 2.5;
const int minDistance = 5;
const int maxDistance = 30;
const int alertThreshold = 85;
const long interval = 1000;

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
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");
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

void loop() {
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    float weight = getStableWeight();
    float weightPercent = min((weight / maxWeight) * 100.0, 100.0);

    int distance = getDistance();
    int heightPercent = getHeightPercent(distance);

    float binLevel = (heightPercent == -1) ? weightPercent : (weightPercent + heightPercent) / 2.0;
    binLevel = constrain(binLevel, 0.0f, 100.0f);

    // GPS Values
    double latitude = gps.location.isValid() ? gps.location.lat() : 0.0;
    double longitude = gps.location.isValid() ? gps.location.lng() : 0.0;

    // Serial Debug
    Serial.println("===== BIN 1 DATA =====");
    Serial.printf("Weight: %.2f kg (%.0f%%)\n", weight, weightPercent);
    Serial.printf("Distance: %d cm (Height %%: %d%%)\n", distance, heightPercent);
    Serial.printf("Bin Level: %.0f%%\n", binLevel);
    Serial.printf("GPS: Lat %.6f, Lon %.6f\n", latitude, longitude);
    Serial.println("======================\n");

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

    // Firebase Upload
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;

      // Build the payload
      String payload = "{";
      payload += "\"weight_kg\":" + String(weight, 3) + ",";
      payload += "\"weight_percent\":" + String((int)weightPercent) + ",";
      payload += "\"distance_cm\":" + String(distance) + ",";
      payload += "\"height_percent\":" + String((int)heightPercent) + ",";
      payload += "\"bin_level\":" + String((int)binLevel) + ",";
      payload += "\"latitude\":" + String(latitude, 6) + ",";
      payload += "\"longitude\":" + String(longitude, 6);
      payload += "}";

      // ✅ Send to Firebase 1 — overwrite at /monitoring/bin1
      http.begin(firebaseHost1 + firebasePath1);
      http.addHeader("Content-Type", "application/json");
      int httpCode1 = http.PUT(payload);
      Serial.print("Firebase 1 Response: ");
      Serial.println(httpCode1);
      http.end();

      // ✅ Send to Firebase 2 — original behavior
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
