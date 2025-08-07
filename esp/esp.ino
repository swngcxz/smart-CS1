#include <WiFi.h>
#include <Wire.h>
#include "HX711.h"
#include <HTTPClient.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// WiFi Credentials
const char* ssid = "ZTE_2.4G_3JyGtw";
const char* password = "4y7JrrGH";

// Firebase Settings - Two Firebase instances
const String firebaseHost1 = "https://smart-9a198-default-rtdb.firebaseio.com"; // From .env file (corrected URL)
const String firebaseHost2 = "https://smartbin-75fc3-default-rtdb.asia-southeast1.firebasedatabase.app"; // Existing Firebase
const String firebasePath = "/monitoring/data.json";

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

// GPS Configuration
TinyGPSPlus gps;
HardwareSerial gpsSerial(1);  // Use UART1
#define GPS_RX 16  // GPS TX → ESP32 RX
#define GPS_TX 17  // GPS RX → ESP32 TX

// GPS Debug and Status
unsigned long lastGPSDebug = 0;
const unsigned long GPS_DEBUG_INTERVAL = 5000; // Debug every 5 seconds
unsigned long gpsStartTime = 0;
bool gpsInitialized = false;
int gpsCharsProcessed = 0;
int gpsSentencesWithFix = 0;
int gpsFailedChecksums = 0;

// Calibration and Thresholds
const float calibration_factor = -309000;
const float maxWeight = 1.0;
const int minDistance = 5;
const int maxDistance = 30;
const int alertThreshold = 85;
const long interval = 1000;

// Connection and retry settings
const int maxRetries = 3;
const int retryDelay = 1000;
unsigned long previousMillis = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("Smart Bin System Starting...");

  // GPS Serial with detailed initialization
  Serial.println("Initializing GPS...");
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  gpsStartTime = millis();
  
  // Test GPS serial communication
  Serial.println("Testing GPS serial communication...");
  delay(1000);
  
  if (gpsSerial.available()) {
    Serial.println("✅ GPS serial is receiving data");
    gpsInitialized = true;
  } else {
    Serial.println("⚠️  No GPS data received yet (this is normal for first startup)");
  }

  // Scale
  scale.begin(DT1, SCK1);
  scale.set_scale(calibration_factor);
  scale.tare();
  Serial.println("Scale initialized and tared");

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
  connectToWiFi();
  
  Serial.println("Setup complete. GPS will take 1-5 minutes to get first fix outdoors.");
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  int attempts = 0;
  
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    digitalWrite(GREEN_LED, HIGH); // Indicate WiFi connection
  } else {
    Serial.println("\nWiFi Connection Failed!");
    digitalWrite(RED_LED, HIGH); // Indicate connection failure
  }
}

void debugGPS() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastGPSDebug >= GPS_DEBUG_INTERVAL) {
    lastGPSDebug = currentTime;
    
    Serial.println("\n=== GPS DEBUG INFO ===");
    Serial.printf("GPS Running Time: %lu seconds\n", (currentTime - gpsStartTime) / 1000);
    Serial.printf("GPS Initialized: %s\n", gpsInitialized ? "Yes" : "No");
    Serial.printf("Chars Processed: %d\n", gpsCharsProcessed);
    Serial.printf("Sentences with Fix: %d\n", gpsSentencesWithFix);
    Serial.printf("Failed Checksums: %d\n", gpsFailedChecksums);
    
    if (gps.location.isValid()) {
      Serial.printf("Location Valid: Yes\n");
      Serial.printf("Latitude: %.6f\n", gps.location.lat());
      Serial.printf("Longitude: %.6f\n", gps.location.lng());
      Serial.printf("Altitude: %.2f meters\n", gps.altitude.meters());
      Serial.printf("Course: %.2f degrees\n", gps.course.deg());
      Serial.printf("Speed: %.2f km/h\n", gps.speed.kmph());
    } else {
      Serial.println("Location Valid: No");
      Serial.printf("Satellites: %d\n", gps.satellites.value());
      Serial.printf("HDOP: %.2f\n", gps.hdop.value());
    }
    
    if (gps.date.isValid()) {
      Serial.printf("Date: %02d/%02d/%02d\n", gps.date.day(), gps.date.month(), gps.date.year());
    }
    
    if (gps.time.isValid()) {
      Serial.printf("Time: %02d:%02d:%02d\n", gps.time.hour(), gps.time.minute(), gps.time.second());
    }
    
    Serial.println("=====================\n");
  }
}

void processGPSData() {
  while (gpsSerial.available()) {
    char c = gpsSerial.read();
    gpsCharsProcessed++;
    
    // Debug: Print raw GPS data (uncomment for troubleshooting)
    // Serial.print(c);
    
    if (gps.encode(c)) {
      gpsSentencesWithFix++;
    }
  }
  
  // Check for GPS encoding errors
  if (gpsCharsProcessed > 10 && gpsSentencesWithFix == 0) {
    Serial.println("⚠️  GPS Warning: No sentences with fix detected. Check wiring and antenna.");
  }
  
  // Check for GPS timeout
  if (millis() > 5000 && gps.charsProcessed() < 10) {
    Serial.println("❌ GPS Error: No GPS detected. Check wiring.");
  }
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

bool sendToFirebase(const String& host, const String& payload, const String& firebaseName) {
  HTTPClient http;
  http.begin(host + firebasePath);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.PUT(payload);
  String response = http.getString();
  
  Serial.print(firebaseName + " Response Code: ");
  Serial.println(httpCode);
  
  if (httpCode == 200) {
    Serial.println(firebaseName + " - Data sent successfully!");
    return true;
  } else {
    Serial.print(firebaseName + " - Failed to send data. Error: ");
    Serial.println(response);
    return false;
  }
  
  http.end();
}

void loop() {
  // Process GPS data
  processGPSData();
  
  // Debug GPS periodically
  debugGPS();

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    float weight = getStableWeight();
    float weightPercent = min((weight / maxWeight) * 100.0, 100.0);

    int distance = getDistance();
    int heightPercent = getHeightPercent(distance);

    float binLevel = (heightPercent == -1) ? weightPercent : (weightPercent + heightPercent) / 2.0;
    binLevel = constrain(binLevel, 0.0f, 100.0f);

    // GPS Values with validation
    double latitude = 0.0;
    double longitude = 0.0;
    
    if (gps.location.isValid()) {
      latitude = gps.location.lat();
      longitude = gps.location.lng();
    } else {
      // Use default coordinates if GPS not working
      latitude = 10.2105;  // Default latitude
      longitude = 123.7583; // Default longitude
    }

    // Serial Debug
    Serial.println("===== BIN DATA =====");
    Serial.printf("Weight: %.2f kg (%.0f%%)\n", weight, weightPercent);
    Serial.printf("Distance: %d cm (Height %%: %d%%)\n", distance, heightPercent);
    Serial.printf("Bin Level: %.0f%%\n", binLevel);
    Serial.printf("GPS: Lat %.6f, Lon %.6f\n", latitude, longitude);
    Serial.printf("GPS Valid: %s\n", gps.location.isValid() ? "Yes" : "No");
    Serial.printf("Satellites: %d\n", gps.satellites.value());
    Serial.println("====================\n");

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
      Serial.println("WiFi disconnected, reconnecting...");
      connectToWiFi();
    }

    // Firebase Upload to both instances
    if (WiFi.status() == WL_CONNECTED) {
      // Build the payload
      String payload = "{";
      payload += "\"weight_kg\":" + String(weight, 3) + ",";
      payload += "\"weight_percent\":" + String((int)weightPercent) + ",";
      payload += "\"distance_cm\":" + String(distance) + ",";
      payload += "\"height_percent\":" + String((int)heightPercent) + ",";
      payload += "\"bin_level\":" + String((int)binLevel) + ",";
      payload += "\"latitude\":" + String(latitude, 6) + ",";
      payload += "\"longitude\":" + String(longitude, 6) + ",";
      payload += "\"gps_valid\":" + String(gps.location.isValid() ? "true" : "false") + ",";
      payload += "\"satellites\":" + String(gps.satellites.value()) + ",";
      payload += "\"timestamp\":" + String(millis());
      payload += "}";

      Serial.println("Sending data to both Firebase instances...");
      Serial.println("Payload: " + payload);

      // Send to Firebase 1 (from .env file) with retry logic
      bool success1 = false;
      for (int i = 0; i < maxRetries && !success1; i++) {
        success1 = sendToFirebase(firebaseHost1, payload, "Firebase 1 (smart-9a198)");
        if (!success1 && i < maxRetries - 1) {
          Serial.printf("Firebase 1 attempt %d failed, retrying...\n", i + 1);
          delay(retryDelay);
        }
      }

      // Send to Firebase 2 (existing) with retry logic
      bool success2 = false;
      for (int i = 0; i < maxRetries && !success2; i++) {
        success2 = sendToFirebase(firebaseHost2, payload, "Firebase 2 (smartbin-75fc3)");
        if (!success2 && i < maxRetries - 1) {
          Serial.printf("Firebase 2 attempt %d failed, retrying...\n", i + 1);
          delay(retryDelay);
        }
      }

      // Summary
      if (success1 && success2) {
        Serial.println("✅ Data sent successfully to both Firebase instances!");
        digitalWrite(GREEN_LED, HIGH);
        digitalWrite(RED_LED, LOW);
      } else if (success1 || success2) {
        Serial.println("⚠️  Data sent to one Firebase instance only");
        digitalWrite(GREEN_LED, HIGH);
        digitalWrite(RED_LED, HIGH); // Both LEDs for partial success
      } else {
        Serial.println("❌ Failed to send data to both Firebase instances");
        digitalWrite(GREEN_LED, LOW);
        digitalWrite(RED_LED, HIGH);
      }
    }
  }

  // Manual Commands
  if (Serial.available()) {
    char input = Serial.read();
    if (input == 't' || input == 'T') {
      scale.tare();
      Serial.println("Tare set!");
    } else if (input == 'r' || input == 'R') {
      Serial.println("Reconnecting WiFi...");
      connectToWiFi();
    } else if (input == 's' || input == 'S') {
      Serial.println("Firebase URLs:");
      Serial.println("Firebase 1: " + firebaseHost1);
      Serial.println("Firebase 2: " + firebaseHost2);
    } else if (input == 'g' || input == 'G') {
      Serial.println("=== GPS STATUS ===");
      Serial.printf("GPS Valid: %s\n", gps.location.isValid() ? "Yes" : "No");
      Serial.printf("Satellites: %d\n", gps.satellites.value());
      Serial.printf("Chars Processed: %d\n", gpsCharsProcessed);
      Serial.printf("Sentences with Fix: %d\n", gpsSentencesWithFix);
      if (gps.location.isValid()) {
        Serial.printf("Latitude: %.6f\n", gps.location.lat());
        Serial.printf("Longitude: %.6f\n", gps.location.lng());
      }
      Serial.println("=================");
    } else if (input == 'd' || input == 'D') {
      Serial.println("=== RAW GPS DATA ===");
      Serial.println("Press any key to stop...");
      unsigned long startTime = millis();
      while (millis() - startTime < 10000) { // Show raw data for 10 seconds
        if (gpsSerial.available()) {
          char c = gpsSerial.read();
          Serial.print(c);
        }
        if (Serial.available()) break;
        delay(10);
      }
      Serial.println("\n=== END RAW GPS DATA ===");
    }
  }
}

