// A program for Choezin's theremin. Her theremin has two ultrasonic
// distance sensors and one speakers.
// TODO: change volume of speaker based on the second distance sensor

#define LEFT_TRIG_PIN 8
#define LEFT_ECHO_PIN 9
#define RIGHT_TRIG_PIN 7
#define RIGHT_ECHO_PIN 6

#define SPEAKER_PIN 10
#define LOW_FREQ 55.0
#define HIGH_FREQ 440.0


struct Theremin {
  String myName;
  int trigPin;
  int echoPin;
  int speakerPin;
  int freq;
  
  void init() {
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    pinMode(speakerPin, OUTPUT);
    freq = LOW_FREQ;
    Serial.println("Initialized theremin.");
  }
  
  // Returns the distance in cm
  float getDist() {
    // Have several readings to get more accurate result
    // Returning the minimal reading
    unsigned int duration = 65535;
    for (int i = 0; i < 3; i++) {
      digitalWrite(trigPin, LOW);
      delayMicroseconds(2);
      digitalWrite(trigPin, HIGH);
      delayMicroseconds(2);
      digitalWrite(trigPin, LOW);
      unsigned int currentDuration = pulseIn(echoPin, HIGH);
      duration = min(duration, currentDuration);
    }
    // Converting to approximate cm
    float cm = duration / 58.0;
    return cm;
  }

  void getDistAndPlay() {
    float d = getDist();
    Serial.print(myName + "  " + "distance: " + String(d) + "  ");
    // if distance less than 100, update the note to play
    if (d < 100) {
      // want a linear to exponential function
      // a linear change in d is converted to a geometric change in freq
      freq = LOW_FREQ * pow(HIGH_FREQ / LOW_FREQ, 100 - d);
    }
    tone(speakerPin, freq);
    Serial.println("frequency: " + String(freq));
  }
};

Theremin theremin {"theremin", LEFT_TRIG_PIN, LEFT_ECHO_PIN, SPEAKER_PIN};


void setup() {
  // For debugging
  Serial.begin(9600);

  // Initializing pins
  theremin.init();
}

void loop() {
  theremin.getDistAndPlay();
  Serial.println("");
}
