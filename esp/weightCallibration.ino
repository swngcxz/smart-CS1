#include "HX711.h"

// HX711 pins for ESP32
#define DT1 33  // DOUT
#define SCK1 32 // SCK

HX711 scale;

// Start with an estimate for calibration factor
float calibration_factor = -309900;

void setup() {
  Serial.begin(115200);
  Serial.println("HX711 Interactive Calibration");

  scale.begin(DT1, SCK1);
  scale.set_scale();  // No factor yet
  scale.tare();       // Reset to 0

  Serial.println("Tare complete. Place a known weight.");
  Serial.println("Use '+' to increase or '-' to decrease calibration factor.");
  Serial.println("Type 's' to show current calibration factor.\n");
}

void loop() {
  scale.set_scale(calibration_factor);

  // Get raw and actual weight
  long raw = scale.get_value();
  float weight = scale.get_units();

  Serial.print("Raw: ");
  Serial.print(raw);
  Serial.print("\tWeight (kg): ");
  Serial.print(weight, 3);
  Serial.print("\tFactor: ");
  Serial.println(calibration_factor, 2);

  delay(1000);

  // Calibration input via Serial
  if (Serial.available()) {
    char command = Serial.read();

    if (command == '+') {
      calibration_factor += 10;
    } else if (command == '-') {
      calibration_factor -= 10;
    } else if (command == 's') {
      Serial.print("Current Calibration Factor: ");
      Serial.println(calibration_factor, 2);
    }

    while (Serial.available()) Serial.read(); // Clear buffer
  }
}
