#include <HardwareSerial.h>
#include <TinyGPS++.h>

// GPS Configuration
TinyGPSPlus gps;
HardwareSerial gpsSerial(1);  // Use UART1
#define GPS_RX 16  // GPS TX → ESP32 RX
#define GPS_TX 17  // GPS RX → ESP32 TX

unsigned long lastPrint = 0;
const unsigned long PRINT_INTERVAL = 1000;

void setup() {
  Serial.begin(115200);
  Serial.println("=== GPS SIMPLE TEST ===");
  Serial.println("Connecting to GPS module...");
  
  // Initialize GPS serial
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  
  Serial.println("GPS initialized. Waiting for data...");
  Serial.println("Move outdoors with clear sky view.");
  Serial.println("First fix can take 1-5 minutes.");
  Serial.println("================================");
}

void loop() {
  // Read GPS data
  while (gpsSerial.available()) {
    char c = gpsSerial.read();
    
    // Print raw data for debugging
    Serial.print(c);
    
    // Parse GPS data
    if (gps.encode(c)) {
      // Data was parsed successfully
    }
  }
  
  // Print status every second
  if (millis() - lastPrint >= PRINT_INTERVAL) {
    lastPrint = millis();
    
    Serial.println("\n=== GPS STATUS ===");
    Serial.printf("Chars Processed: %d\n", gps.charsProcessed());
    Serial.printf("Sentences with Fix: %d\n", gps.sentencesWithFix());
    Serial.printf("Failed Checksums: %d\n", gps.failedChecksum());
    
    if (gps.location.isValid()) {
      Serial.printf("Location: %.6f, %.6f\n", gps.location.lat(), gps.location.lng());
      Serial.printf("Altitude: %.2f meters\n", gps.altitude.meters());
    } else {
      Serial.println("Location: Invalid");
    }
    
    Serial.printf("Satellites: %d\n", gps.satellites.value());
    Serial.printf("HDOP: %.2f\n", gps.hdop.value());
    
    if (gps.date.isValid()) {
      Serial.printf("Date: %02d/%02d/%02d\n", gps.date.day(), gps.date.month(), gps.date.year());
    } else {
      Serial.println("Date: Invalid");
    }
    
    if (gps.time.isValid()) {
      Serial.printf("Time: %02d:%02d:%02d\n", gps.time.hour(), gps.time.minute(), gps.time.second());
    } else {
      Serial.println("Time: Invalid");
    }
    
    Serial.println("==================\n");
  }
  
  // Check for GPS timeout
  if (millis() > 5000 && gps.charsProcessed() < 10) {
    Serial.println("❌ ERROR: No GPS detected. Check wiring!");
    Serial.println("Make sure:");
    Serial.println("1. GPS module is powered (3.3V)");
    Serial.println("2. TX from GPS → RX on ESP32 (GPIO 16)");
    Serial.println("3. GND is connected");
    Serial.println("4. GPS module has antenna");
    delay(5000);
  }
} 