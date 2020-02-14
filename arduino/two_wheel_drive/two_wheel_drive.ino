// A program for a two-wheeled car built by Cason, Thomas, Hank, and Matus.
// Car has no motor control shield and circuit has no H-bridge.

const int leftMotorPin = 10;
const int rightMotorPin = 11;
const int echoPin = 5;
const int trigPin = 6;


struct Motor {
  int pin;
  void init() { pinMode(pin, OUTPUT); }
  void go() { digitalWrite(pin, HIGH); }
  void pause() { digitalWrite(pin, LOW); }  // "stop" is already a keyword in arduino
};

Motor left {leftMotorPin};
Motor right {rightMotorPin};

struct Dist {
  int trigPin;
  int echoPin;
  void init() {
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
  }
  // Returns the distance in cm
  unsigned int getDist() {
    // Have several readings to get more accurate result
    // Returning the minimal reading
    unsigned int duration = 65535;
    for (int i = 0; i < 10; i++) {
      digitalWrite(trigPin, LOW);
      delayMicroseconds(2);
      digitalWrite(trigPin, HIGH);
      delayMicroseconds(2);
      digitalWrite(trigPin, LOW);
      unsigned int currentDuration = pulseIn(echoPin, HIGH);
      if (currentDuration < duration) {
        duration = currentDuration; 
      }
    }
    // Converting to approximate cm
    return duration / 150;
  }
};

Dist sensor {trigPin, echoPin};


void setup() {
  left.init();
  right.init();
  sensor.init();
}

void loop() {
  int r = random(1000, 5000);
  goForward(r);
  int s = random(400, 1000);
  if (r % 2) {
    rotateCW(s);
  } else {
    rotateCCW(s);
  }
}

void goForward(int ms) {
  unsigned long start = millis();
  while((millis() < start + ms) && (sensor.getDist() < 10)) {
    left.go();
    right.go();
  }
}

void rotateCW(int ms) {
  unsigned long start = millis();
  while(millis() < start + ms) {
    left.go();
    right.pause();
  }
}

void rotateCCW(int ms) {
  unsigned long start = millis();
  while(millis() < start + ms) {
    right.go();
    left.pause();
  }
}
