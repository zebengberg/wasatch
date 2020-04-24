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
#define LEDPIN 6
#define FANPIN1 8
#define FANPIN2 9

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
  if (getVoltage() < 12.5) {
    // Blink every 10ms
    int state = millis() / 10 % 2;
    digitalWrite(LEDPIN, state);
  } else {
    // Blink a pattern every 100ms
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
  switch (buttonState) {
    case 0:
      digitalWrite(FANPIN1, LOW);
      digitalWrite(FANPIN2, LOW);
      break;
      
    case 1:
      // Fans powered on depending on voltage.
      if (getVoltage() > 13) {
        digitalWrite(FANPIN1, HIGH);
        digitalWrite(FANPIN2, HIGH);
      } else if (getVoltage() < 12.6) {
        digitalWrite(FANPIN1, LOW);
        digitalWrite(FANPIN2, LOW);
      }
      break;
      
    case 2:
      // Fans on.
      digitalWrite(FANPIN1, HIGH);
      digitalWrite(FANPIN2, HIGH);
      break;
  }
}
