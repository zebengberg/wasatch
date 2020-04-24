/*
 * Code to control 12V DC fans inside of greenhouse.
 * The 12V battery is charged by a solar panel. If both the
 * battery voltage is high enough and the temperature is warm
 * enough, the fans turn on.
 */


// pins and constants
#define VOLTAGEPIN 0
#define BUTTONPIN 2
#define RESISTOR1 100000.0
#define RESISTOR2 10000.0
#define LEDPIN 13
#define FANPIN1 10
#define FANPIN2 11


// global variables
unsigned int buttonState = 0;
bool isButtonDown = false;


void setup(){
   pinMode(BUTTONPIN, INPUT);
   pinMode(LEDPIN, OUTPUT);
   pinMode(FANPIN1, OUTPUT);
   pinMode(FANPIN2, OUTPUT);
}


void loop(){
  setButtonState();
  blinkLED();
  runFans();
}


// Reading the exact voltage of the 12V battery.
float getVoltage() {
  float vout = analogRead(VOLTAGEPIN) * 5.0 / 1024.0;
  // Scaling based on true voltmeter reading.
  vout *= 8.23 / 7.90;
  // Using formula.
  float vin = vout * (RESISTOR1 + RESISTOR2) / RESISTOR2;
  return vin;
}


// Reading the state of the button and setting global button
// variables.
void setButtonState() {
  // Getting instance when button first pressed.
  if (digitalRead(BUTTONPIN) && !isButtonDown) {
    isButtonDown = true;
    buttonState++;
    buttonState %= 3;
  } else if (!digitalRead(BUTTONPIN)) {
    isButtonDown = false;
  }
}


// Blink LED to indicate button state or low voltage.
void blinkLED() {
  if (getVoltage() < 12.2) {
    // Blink every 100ms to indicate low voltage.
    int state = millis() / 100 % 2;
    digitalWrite(LEDPIN, state);
  } else {
    // Blink a pattern every 1000ms.
    int state = millis() / 100 % 10;
    switch (buttonState) {
      case 0:
        digitalWrite(LEDPIN, state == 0);
        break;
      case 1:
        digitalWrite(LEDPIN, state == 0 || state == 2);
        break;
      case 2:
        digitalWrite(LEDPIN, state == 0 || state == 2  || state == 4);
        break;
    }
  }
}


// Use transistors to power fans.
void runFans() {
  float voltage = getVoltage();
  switch (buttonState) {
    case 0:
      // Power one fan depending on voltage.
      digitalWrite(FANPIN2, LOW);
      if (voltage > 13.0) {
        digitalWrite(FANPIN1, HIGH);
      } else if (voltage < 12.5) {
        digitalWrite(FANPIN1, LOW);
      }
      break;
      
    case 1:
      // Power both fans depending on voltage.
      if (voltage > 13.0) {
        digitalWrite(FANPIN1, HIGH);
        digitalWrite(FANPIN2, HIGH);
      } else if (voltage < 12.5) {
        digitalWrite(FANPIN1, LOW);
        digitalWrite(FANPIN2, LOW);
      } else if (voltage < 12.8) {
        digitalWrite(FANPIN1, HIGH);
        digitalWrite(FANPIN2, LOW);
      }
      break;
      
    case 2:
      // Power both fans unless voltage very low.
      digitalWrite(FANPIN1, voltage > 12.2);
      digitalWrite(FANPIN2, voltage > 12.2);
      break;
  }
}
