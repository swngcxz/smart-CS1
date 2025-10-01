#include <WiFi.h>
#include <HTTPClient.h>
#include <HX711.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// -------------------- WiFi & Firebase --------------------
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
String firebaseUrl = "https://YOUR_FIREBASE_PROJECT.firebaseio.com/bin_data.json"; 

// -------------------- Load Cell --------------------
#define DOUT  18
#define CLK   19
HX711 scale;

// -------------------- Ultrasonic Sensor --------------------
#define TRIG_PIN  5
#define ECHO_PIN  17
long duration;
float distance;

// -------------------- Bin Parameters --------------------
float binHeight = 40.0; // cm
float maxWeight = 2.5;  // kg

// -------------------- GPS --------------------
TinyGPSPlus gps;
HardwareSerial gpsSerial(1);
double lastLat = 0.0, lastLng = 0.0;
unsigned long lastFixTime = 0;
bool gpsFixAvailable = false;

// -------------------- Timing --------------------
unsigned long lastSendTime = 0;
const long sendInterval = 10000; // 10 seconds

// -------------------- WiFi --------------------
void connectWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("Connected!");
}

// -------------------- GPS Timestamp --------------------
String getGPSTimestamp() {
  if (gps.date.isValid() && gps.time.isValid()) {
    char buf[25];
    sprintf(buf, "%04d-%02d-%02d %02d:%02d:%02d",
      gps.date.year(),
      gps.date.month(),
      gps.date.day(),
      gps.time.hour(),
      gps.time.minute(),
      gps.time.second()
    );
    return String(buf);
  }
  return "N/A";  
}

// -------------------- Last Active --------------------
String getActiveAgo() {
  unsigned long diff = (millis() - lastFixTime) / 1000;
  if (diff < 60) return String(diff) + "s ago";
  else if (diff < 3600) return String(diff / 60) + "m ago";
  else return String(diff / 3600) + "h ago";
}

// -------------------- Setup --------------------
void setup() {
  Serial.begin(115200);
  
  // GPS
  gpsSerial.begin(9600, SERIAL_8N1, 16, 4); 

  // Load Cell
  scale.begin(DOUT, CLK);
  scale.set_scale();   
  scale.tare();        

  // Ultrasonic
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  connectWiFi();
}

// -------------------- Loop --------------------
void loop() {
  // Read GPS continuously
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
    if (gps.location.isValid()) {
      lastLat = gps.location.lat();
      lastLng = gps.location.lng();
      lastFixTime = millis();
      gpsFixAvailable = true;
    }
  }

  // Every interval → send data
  if (millis() - lastSendTime > sendInterval) {
    lastSendTime = millis();

    // Load cell (kg)
    float weight = scale.get_units(5);
    if (weight < 0) weight = 0;
    float weightPercent = (weight / maxWeight) * 100.0;
    if (weightPercent > 100) weightPercent = 100;

    // Ultrasonic (cm)
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    duration = pulseIn(ECHO_PIN, HIGH, 30000);
    distance = (duration * 0.0343) / 2;
    if (distance <= 0 || distance > binHeight) distance = binHeight;
    float heightPercent = ((binHeight - distance) / binHeight) * 100.0;
    if (heightPercent < 0) heightPercent = 0;
    if (heightPercent > 100) heightPercent = 100;

    // Bin level average
    float binLevel = (weightPercent + heightPercent) / 2.0;

    // Build Firebase JSON
    String payload = "{";
    payload += "\"weight_kg\":" + String(weight, 3) + ",";
    payload += "\"weight_percent\":" + String((int)weightPercent) + ",";
    payload += "\"distance_cm\":" + String(distance) + ",";
    payload += "\"height_percent\":" + String((int)heightPercent) + ",";
    payload += "\"bin_level\":" + String((int)binLevel) + ",";
    payload += "\"satellites\":" + String(gps.satellites.value()) + ",";
    payload += "\"last_active\":\"" + getActiveAgo() + "\",";
    payload += "\"gps_timestamp\":\"" + getGPSTimestamp() + "\"";

    // Add lat/lng only if we ever had a fix
    if (gpsFixAvailable) {
      payload += ",";
      payload += "\"latitude\":" + String(lastLat, 6) + ",";
      payload += "\"longitude\":" + String(lastLng, 6);
    }

    payload += "}";

    // Send to Firebase
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(firebaseUrl);
      http.addHeader("Content-Type", "application/json");
      int httpResponseCode = http.PUT(payload);

      Serial.println("Data Sent: " + payload);
      if (httpResponseCode > 0) {
        Serial.println("Response: " + String(httpResponseCode));
      } else {
        Serial.println("Error sending data");
      }
      http.end();
    } else {
      connectWiFi();
    }
  }
}
