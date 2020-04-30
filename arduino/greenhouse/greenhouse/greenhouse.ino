/*
 * Code to control 12V DC fans inside of greenhouse.
 * The 12V battery is charged by a solar panel. If both the
 * battery voltage is high enough and the temperature is warm
 * enough, the fans turn on. Both transistors are attached to
 * the same heatsink, and thus share a common collector. We
 * cannot operator each independently with this setup.
 */


// pins and constants
#define VOLTAGEPIN 0
#define BUTTONPIN 2
#define RESISTOR1 100000.0
#define RESISTOR2 10000.0
#define LEDPIN 13
#define LIGHTPIN 2
#define FANPIN1 10
#define FANPIN2 11


// global variables
unsigned int buttonState = 0;
bool isButtonDown = false;
bool fanState = LOW;


void setup(){
   pinMode(BUTTONPIN, INPUT);
   pinMode(LIGHTPIN, INPUT);
   pinMode(LEDPIN, OUTPUT);
   pinMode(FANPIN1, OUTPUT);
   pinMode(FANPIN2, OUTPUT);
   Serial.begin(9600);
}


void loop(){
  setButtonState();
  blinkLED();
  runFans();
}


// Read the exact voltage of the 12V battery.
float getVoltage() {
  float vout = analogRead(VOLTAGEPIN) * 5.0 / 1024.0;
  // Scaling based on true voltmeter reading.
  vout *= 8.23 / 7.90;
  // Using formula.
  float vin = vout * (RESISTOR1 + RESISTOR2) / RESISTOR2;
  return vin;
}

// Read the value from the light sensor.
int getLight() {
  return analogRead(LIGHTPIN);
}


// Read the state of the button and setting global button
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
  int light = getLight();  // values between 0 and 1023
  Serial.println(voltage);
  
  switch (buttonState) {
    case 0:
      // Power fans depending on voltage and light.
      // There is an intermediate range in which fanState not changed.
      if (voltage > 13.4 && light > 700) {
        fanState = HIGH;
      } else if (voltage < 12.6 || light < 600) {
        fanState = LOW;
      }
      break;
      
    case 1:
      // Power fans depending on voltage.
      if (voltage > 13.4) {
        fanState = HIGH;
      } else if (voltage < 12.6) {
        fanState = LOW;
      }
      break;
      
    case 2:
      // Power both fans unless voltage very low.
      if (voltage > 12.2) {
        fanState = HIGH;
      } else {
        fanState = LOW;
      }
      break;
  }

  // Writing fanState to transistors.
  digitalWrite(FANPIN1, fanState);
  digitalWrite(FANPIN2, fanState);
}
