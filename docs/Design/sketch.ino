// OfficeVolt — Work Room 1 reference firmware (ESP32, Arduino framework)
// Demonstrates: relay pin control + INA219 current sensing
// This is illustrative firmware for your own Wokwi sketch — not a project expo

#include <Wire.h>
#include <Adafruit_INA219.h>

// --- Pin map (see A.2 above) ---
const int PIN_FAN_1 = 16;
const int PIN_FAN_2 = 17;
const int PIN_LIGHT_1 = 18;
const int PIN_LIGHT_2 = 19;
const int PIN_LIGHT_3 = 21;

const int PIN_I2C_SDA = 25;
const int PIN_I2C_SCL = 26;

// Relay modules used here are active-LOW (common for cheap opto-isolated board
// Flip these constants if your specific relay module is active-HIGH instead.
const int RELAY_ON = HIGH;
const int RELAY_OFF = LOW;

Adafruit_INA219 ina219;

struct Device {
const char* name;
int pin;
bool isOn;
};

Device devices[] = {
{ "Fan 1", PIN_FAN_1, true },
{ "Fan 2", PIN_FAN_2, true },
{ "Light 1", PIN_LIGHT_1, true },
{ "Light 2", PIN_LIGHT_2, true },
{ "Light 3", PIN_LIGHT_3, true },
};
const int DEVICE_COUNT = sizeof(devices) / sizeof(devices[0]);

void setDevice(int index, bool on) {
devices[index].isOn = on;
digitalWrite(devices[index].pin, on ? RELAY_ON : RELAY_OFF);
Serial.printf("%s -> %s\n", devices[index].name, on ? "ON" : "OFF");
}
void setup() {
Serial.begin(115200);
for (int i = 0; i < DEVICE_COUNT; i++) {
pinMode(devices[i].pin, OUTPUT);
digitalWrite(devices[i].pin, RELAY_OFF); // all off at boot
}
Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
if (!ina219.begin()) {
Serial.println("INA219 not found — check wiring (SDA/SCL/VCC/GND).");
} else {
Serial.println("INA219 initialized.");
}
// Demo boot sequence — replace with real control logic
// (e.g. serial commands, MQTT, or backend polling in a later phase)
setDevice(0, true); // Fan 1 on
setDevice(2, true); // Light 1 on
setDevice(1, false);  
setDevice(3, false); 
setDevice(4, false);
}

void loop() {
// Read current/power from the INA219 (stand-in for the "fan branch" load)
float busVoltage_V = ina219.getBusVoltage_V();
float current_mA = ina219.getCurrent_mA();
float power_mW = ina219.getPower_mW();
Serial.printf(
"Bus: %.2fV | Current: %.2fmA | Power: %.2fmW\n",
busVoltage_V, current_mA, power_mW
);
delay(2000);
}