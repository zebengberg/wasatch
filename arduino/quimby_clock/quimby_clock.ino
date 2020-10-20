// Code for Quimby's arduino binary block

// Globals updated in loop().
unsigned long h, m, s, old_ms, new_ms;
unsigned long long total_ms;

// Starting from smallest time bit, moving to biggest.
static const int ledArray[] = {35, 33, 31, 50, 48, 46, 44, 42, 40, 38, 34, 32, 30, 28, 26, 24, 22};


void setup() {
  // Time at which the arduino is first powered on.
  h = 11;
  m = 12;
  s = 10;
  total_ms = 1000 * (3600 * h + 60 * m + s);
  
  for (int i = 0; i < 17; i++) {
    pinMode(ledArray[i], OUTPUT);
  }
}

void loop() {
  // Using new_ms and old_ms to avoid unsigned long overflow.
  new_ms = millis();
  // Catching the overflow -- only update when new_ms hasn't reset to 0.
  // Will lose a small fraction of 1ms on the clock here during every overflow (~50 days).
  if (new_ms >= old_ms) {
    total_ms += new_ms - old_ms;
  }
  old_ms = new_ms;

  // Printing to LEDs
  unsigned long bin_time = bin_encode(total_ms);
  for (int i = 0; i < 17; i++) {
    // Extracting the state according to the binary representation of seconds.
    digitalWrite(ledArray[i], bin_time >> i & 1);
  }
}

unsigned long bin_encode(unsigned long long ms) {
  unsigned long s = ms / 1000 % 60;
  unsigned long m = ((ms / 1000 - s) / 60) % 60;
  unsigned long h = ((((ms / 1000 - s) / 60) - m) / 60) % 24;
  unsigned long bin = s | (m << 6) | (h << 12);
  return bin;
}
