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
unsigned long fanTimestamp = 0;


void setup(){
   pinMode(BUTTONPIN, INPUT);
   pinMode(LIGHTPIN, INPUT);
   pinMode(LEDPIN, OUTPUT);
   pinMode(FANPIN1, OUTPUT);
   pinMode(FANPIN2, OUTPUT);
}


void loop(){
  setButtonState();
  blinkLED();
  timeCheck();  // determines if fans should turn on
}


// Read the voltage of the 12V battery.
float getVoltage() {
  float vout = analogRead(VOLTAGEPIN) * 5.0 / 1024.0;
  // Scaling based on true voltmeter reading.
  vout *= 8.23 / 7.90;
  // Using formula.
  float vin = vout * (RESISTOR1 + RESISTOR2) / RESISTOR2;
  return vin;
}


// Read the voltage of the 12V battery when it's powering the load.
float getLoadVoltage() {
  float voltage = getVoltage();
  
  // Only turn on fans if voltage is sufficiently high.
  if (voltage > 12.6 && !fanState) {
    digitalWrite(FANPIN1, HIGH);
    digitalWrite(FANPIN2, HIGH);
    delay(20);
    voltage = getVoltage();
    delay(5);
    digitalWrite(FANPIN1, LOW);
    digitalWrite(FANPIN2, LOW);
  }
  return voltage;
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
    setFanState();  // called once button pressed
  } else if (!digitalRead(BUTTONPIN)) {
    isButtonDown = false;
  }
}


// Blink LED to indicate button state or low voltage.
void blinkLED() {
  if (getVoltage() < 12.2) {
    // Blink every 200ms to indicate low voltage.
    int state = millis() / 200 % 2;
    digitalWrite(LEDPIN, state);
  } else {
    // Blink a pattern every 2000ms.
    int state = millis() / 200 % 10;
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


// Consider calling setFanState() every 5 minutes or when millis() resets.
void timeCheck() {
  if (millis() == 0 || millis() > fanTimestamp + 1000ul * 60ul * 5ul) {
    setFanState();
  }
}


// Set the fanState variable and use transistors to power fans.
void setFanState() {
  fanTimestamp = millis();  // updating timestamp when fan was set
  
  float voltage = getLoadVoltage();  // expensive to call
  int light = getLight();  // values between 0 and 1023

  switch (buttonState) {
    case 0:
      // Power fans depending on voltage and light.
      // There is an intermediate range in which fanState not changed.
      if (voltage > 13.0 && light > 750) {
        fanState = HIGH;
      } else if (voltage < 12.8 || light < 650) {
        fanState = LOW;
      }
      break;
      
    case 1:
      // Power fans depending on voltage.
      if (voltage > 13.0) {
        fanState = HIGH;
      } else if (voltage < 12.8) {
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
