#include "FastLED.h"

#define BUTTON_PIN 2
#define NUM_LEDS 150
#define LED_PIN 7
CRGB leds[NUM_LEDS];  // object from FastLED library


// Parameters for switching which function to run and getting button input
#define NUM_STATES 6
bool isButtonFirstPressed = true;  // used to get first button press
unsigned long start_time = 0;
byte state = 5;

// Parameters for rainbow()
byte j = 0;
byte k = 0;

// Parameters for bounce()
double x1 = random(35);
double x2 = random(40, 75);
double x3 = random(80, 115);
double x4 = random(120, 145);
double dx1 = random(100) / 100.0 - 0.5;
double dx2 = random(100) / 100.0 - 0.5;
double dx3 = random(100) / 100.0 - 0.5;
double dx4 = random(100) / 100.0 - 0.5;
double color = 0;
bool isColorIncreasing = true;

// Parameters for stepper()
double x = 148;
double dx = 0;
int currentStep = 140;
bool isMovingDown = true;

// Parameters for math()
double t = 0;

// Parameters for randomFill()
bool isOn[NUM_LEDS] = { false };
int numOn = 0;
CRGB colors = CRGB(random(256), random(256), random(256));

// Parameters for stack()
int currentTop = NUM_LEDS - 1;
int currentIndex = 0;



void setup() {
  randomSeed(analogRead(0));
  FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS);
}

void loop() {
  changeState();

  switch (state) {
    case 0:
      stepper();
      break;
    case 1:
      rainbow();
      break;
    case 2:
      bounce();
      break;
    case 3:
      math();
      break;
    case 4:
      randomFill();
      break;
    case 5:
      stack();
      break;
  }
}

// Change state every minute or when button is pressed
void changeState() {
  // Checking if a minute has elapsed
  if (millis() > start_time + 1000UL * 60UL) {
    start_time = millis();
    setRandomState();
    return;  // early exit
  }
  // Checking if button is pressed
  if (digitalRead(BUTTON_PIN)) {
    if (isButtonFirstPressed) {
      start_time = millis();
      setRandomState();
      isButtonFirstPressed = false;
    }
  } else {
    isButtonFirstPressed = true;
  }
}

// Set the value of state to a random different value
void setRandomState() {
  byte r = random(0, NUM_STATES - 1);
  if (r >= state) {
    r++;
  }
  state = r;
  FastLED.clear();
}


void rainbow() {
  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i].r = map(i, 0, NUM_LEDS, 0, 255);
    leds[i].g = j;
    leds[i].b = k;
  }

  // updating j
  if (k % 2) {
    j++;
  } else {
    j--;
  }

  // updating k
  if (j == 0) {
    k++;
  }
  FastLED.show();
  delay(10);
}


void bounce() {
  double temp;
  if (x1 <= 2) {
    dx1 *= -1;
  }
  if ((x2 >= 7) && (x1 + 2 >= x2 - 2)) {
    temp = dx1;
    dx1 = dx2;
    dx2 = temp;
  }
  if (x2 + 2 >= x3 - 2) {
    temp = dx2;
    dx2 = dx3;
    dx3 = temp;
  }
  if (x3 + 2 >= x4 - 2) {
    temp = dx3;
    dx3 = dx4;
    dx4 = temp;
  }
  if ((x3 <= NUM_LEDS - 7) && (x4 >= NUM_LEDS - 3)) {
    dx4 *= -1;
  }
  x1 += dx1;
  x2 += dx2;
  x3 += dx3;
  x4 += dx4;
  // Clearing the strip
  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i].r = 0;
    leds[i].g = 0;
    leds[i].b = 100;
  }
  for (int i = x1 - 2; i <= x1 + 2; i++) {
    leds[i].r = 255;
    leds[i].g = 120;
    leds[i].b = 0;
  }
  for (int i = x2 - 2; i <= x2 + 2; i++) {
    leds[i].r = 255;
    leds[i].g = 0;
    leds[i].b = 0;
  }
  for (int i = x3 - 2; i <= x3 + 2; i++) {
    leds[i].r = 255;
    leds[i].g = 255;
    leds[i].b = 0;
  }
  for (int i = x4 - 2; i <= x4 + 2; i++) {
    leds[i].r = 0;
    leds[i].g = 255;
    leds[i].b = 0;
  }
  FastLED.show();
  delay(10);
}

// Object bouncing down steps
void stepper() {
  // updating the color
  if (color >= 255) {
    isColorIncreasing = false;
  } else if (color <= 0) {
    isColorIncreasing = true;
  }

  isColorIncreasing ? color += 0.3 : color -= 0.3;

  // Bouncing off currentStep
  if ((x <= currentStep + 2) && (dx < 0)) {
    dx *= -1;
    if (currentStep == 0) {
      isMovingDown = false;
    } else if (currentStep == 140) {
      isMovingDown = true;
    }

    isMovingDown ? currentStep -= 20 : currentStep += 20;

  } else {
    dx -= 0.02;
  }
  x += dx;

  // Clearing the strip
  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i].r = 1;
    leds[i].g = 1;
    leds[i].b = 10;
  }
  // Showing the ball
  for (int i = x - 2; i <= x + 2; i++) {
    leds[i].r = color;
    leds[i].g = 255 - color;
    leds[i].b = 5;
  }
  FastLED.show();
  delay(10);
}

// Showing parametric curves involving sine and cosine
void math() {
  // Updating time
  t += .01;

  // Clearing the strip
  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i].r = 0;
    leds[i].g = 2;
    leds[i].b = 2;
  }

  // Showing a patch for sine
  int y = NUM_LEDS / 2 + NUM_LEDS * sin(t) / 2;
  leds[y].r = 255;
  leds[y].g = 0;
  leds[y].b = 0;

  // Showing another patch for cosine
  y = NUM_LEDS / 2 + NUM_LEDS * cos(t) / 2;
  leds[y].r = 255;
  leds[y].g = 255;
  leds[y].b = 0;

  FastLED.show();
  delay(10);
}


// Randomly fill in the empty LED strip
void randomFill() {
  // If completely full, reset
  if (numOn >= NUM_LEDS - 1) {
    numOn = 0;
    colors = CRGB(random(256), random(256), random(256));
    for (int i = 0; i < NUM_LEDS; i++) {
      isOn[i] = false;
    }
    FastLED.show();
    delay(10);
  }

  // Getting random led to illuminate
  int r = random(NUM_LEDS - numOn);
  int i = 0;
  while (r >= 0) {
    if (!isOn[i]) {
      r--;
    }
    i++;
  }
  i--;  // incremented i too many times

  // Updating globals
  isOn[i] = true;
  numOn++;

  // Drawing
  leds[i] = colors;
  FastLED.show();
  delay(40);
}


// Stack the LED
void stack() {
  // Writing to first LED
  if (currentIndex == 0) {
    leds[0].r = 5;
    leds[0].g = 255;
    leds[0].b = 5;
  } else {
    // Writing to every 10th LED
    for (int j = currentIndex; j >= 0; j -= 10) {
      leds[j].r = 5;
      leds[j].g = 255;
      leds[j].b = 5;
      leds[j - 1].r = 0;
      leds[j - 1].g = 0;
      leds[j - 1].b = 0;
    }
  }
  currentIndex++;

  // Resetting indices
  if (currentIndex > currentTop) {
    currentIndex -= 10;
    currentTop--;
  }
  if (currentTop == 0) {
    currentTop = NUM_LEDS - 1;
  }

  FastLED.show();
  delay(10);
}
