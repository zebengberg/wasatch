// A program for Choezin's theremin. Her theremin has two ultrasonic
// distance sensors and two speakers.

const int leftTrigPin = 8;
const int leftEchoPin = 9;
const int leftSpeakerPin = 10;
const int rightTrigPin = 7;
const int rightEchoPin = 6;
const int rightSpeakerPin = 11;

const int sizeOfScale = 30;
unsigned int scale[sizeOfScale];  // uninitialized array


struct Theremin {
  int trigPin;
  int echoPin;
  int speakerPin;
  
  void init() {
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    pinMode(speakerPin, OUTPUT);
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

  void getDistAndPlay() {
    unsigned int d = getDist();
    if (d < 100) {  // 1 meter max
      // if distance less than 5, play nothing
      if (d < 5) {
        pause();
      }
      else {
        int note = map(d, 5, 100, 0, sizeOfScale);
        playFreq(scale[note]);
      }
    } else {
      int note = random(0, sizeOfScale);
      playFreq(scale[note]);
    }
  }

  void playFreq(int freq) {
    tone(speakerPin, freq);
  }

  void pause() {
    noTone(speakerPin);
  }
};

Theremin left {leftTrigPin, leftEchoPin};
Theremin right {rightTrigPin, rightEchoPin};


void setup() {
  // Building up the scale of notes to be used for playing music
  unsigned int baseFreq = 110;
  // an array of notes mod 12
  float blues[6] = {0, 3, 5, 6, 7, 10};
  
  for (int i = 0; i < sizeOfScale; i++) {
    int q = i / 6;  // quotient
    int r = i % 6;  // remainder
    // populating the array; float type will be cast back to unsigned int
    scale[i] = baseFreq * q + float(baseFreq) * pow(2.0, blues[r] / 12.0);
  }

  // Initializing pins
  left.init();
  right.init();
}

void loop() {
  left.getDistAndPlay();
  right.getDistAndPlay();
  delay(100);
}
