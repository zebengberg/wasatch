// A program for Choezin's theremin. Her theremin has two ultrasonic
// distance sensors and two speakers.

const int leftTrigPin = 8;
const int leftEchoPin = 9;
const int leftSpeakerPin = 10;

const int rightTrigPin = 7;
const int rightEchoPin = 6;
const int rightSpeakerPin = 11;

const int sizeOfScale = 20;
unsigned int scale[sizeOfScale];  // uninitialized array


struct Theremin {
  String name;
  int trigPin;
  int echoPin;
  int speakerPin;
  
  void init() {
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    pinMode(speakerPin, OUTPUT);
    Serial.println("Initialized theremin.");
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
    unsigned int cm = duration / 50;
    Serial.print("Distance in cm: ");
    Serial.println(cm);
    return cm;
  }

  void getDistAndPlay() {
    unsigned int d = getDist();
    // if distance greater than 50, play nothing
    if (d > 50) {
      pause();
    } else {
      int note = map(d, 0, 50, sizeOfScale, 0);
      playFreq(scale[note]);
    }
  }

  void playFreq(int freq) {
    Serial.print("Playing frequency: ");
    Serial.println(freq);
    tone(speakerPin, freq);
  }

  void pause() {
    noTone(speakerPin);
  }
};

Theremin left {"left", leftTrigPin, leftEchoPin, leftSpeakerPin};
Theremin right {"right", rightTrigPin, rightEchoPin, rightSpeakerPin};


void setup() {
  // For debugging
  Serial.begin(9600);
  
  // Building up the scale of notes to be used for playing music
  unsigned int baseFreq = 110;
  // an array of notes mod 12
  float penta[5] = {0, 2, 4, 7, 9};
  
  for (int i = 0; i < sizeOfScale; i++) {
    int q = i / 5;  // quotient
    int r = i % 5;  // remainder
    // populating the array; float type will be cast back to unsigned int
    scale[i] = baseFreq * q + float(baseFreq) * pow(2.0, penta[r] / 12.0);
  }

  // Initializing pins
  left.init();
  right.init();
}

void loop() {
  left.getDistAndPlay();
  //right.getDistAndPlay();
  delay(1000);
}
