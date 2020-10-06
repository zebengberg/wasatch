/*
 * Arduino used as a Spectrophotometer
 * Written by: Milton Watts  6/11/2020 for Engineering Principles
 * Modified by: Zeb!
 * 
 * Hardware configuration:
 * One or two tri-color LED's with common cathode are used - one for lighting, and the 2nd for an optional blinking display.
 * LED's share RED, GREEN and BLUE pins but have their own Common pin
 * To turn on an LED the color pin should be set high while the common pin is set low.
 * To prevent reverse current when an LED is off, set its common pin to INPUT when not in use rather than setting it HIGH.
 * 
 * A photoresistor is connected to an analog pin with a pull-up resistor to 5V.  
 * 10k is a reasonable value or you can use the internal pull-up resistor in the Arduino
 * 
 * The code turns on each color briefly and then samples the voltage on the connected photoresistor
 * The voltage readings are on a scale from 0 to 1023.  
 * Output is reported on the serial port (Tools->Serial Monitor) and as blinking lights.   
 * Count the pulses of each color to determine the 3 or 4-digit value for that color.  
 * Zero is displayed as a single very short pulse 
 */

// Color pins shared by all LEDs 
#define RED_PIN 9
#define GREEN_PIN 10
#define BLUE_PIN 11

// Photoresistor connected to an Analog pin using either internal or external pullup resistor to 5V
#define PR_PIN A0

// Blinking speeds
#define DELAY 200
#define BAUDRATE 9600

void setup() {
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  pinMode(PR_PIN, INPUT);  // Assumes a 10k resistor to 5V with photo-resistor to GND

  delay(DELAY);
  Serial.print("\n");
  Serial.begin(BAUDRATE);
  Serial.print("magenta\tred\tyellow\tgreen\tcyan\tblue\twhite\n");
}

void loop() {
  measurePR(true, false, true);   // magenta
  measurePR(true, false, false);  // red
  measurePR(true, true, false);   // yellow
  measurePR(false, true, false);  // green
  measurePR(false, true, true);   // cyan
  measurePR(false, false, true);  // blue
  measurePR(true, true, true);    // white
  Serial.print("\n");
}

void measurePR(bool r, bool g, bool b) {
  digitalWrite(RED_PIN, r);
  digitalWrite(GREEN_PIN, g);
  digitalWrite(BLUE_PIN, b);
  delay(DELAY);
  
  int sensorValue = analogRead(PR_PIN);
  sensorValue = 1023 - sensorValue;

  delay(DELAY);
  digitalWrite(RED_PIN, LOW);
  digitalWrite(GREEN_PIN, LOW);
  digitalWrite(BLUE_PIN, LOW);
  
  Serial.print(sensorValue);
  Serial.print("\t");
}
