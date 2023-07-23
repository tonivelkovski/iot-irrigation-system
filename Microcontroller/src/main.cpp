#include <Arduino.h>
#include <WiFi.h>
#include <DHT.h>
#include <Adafruit_Sensor.h>
#include <HTTPClient.h>
#include <ESPmDNS.h>

const char *ssid = "TONI 2052";
const char *password = "60K4-m87";
const char *serverUrl = "https://10.85.11.238:3000/";
const char *hostname = "irrigation-system";

WiFiServer server(80);

#define SOIL_MOISTURE_PIN 35
#define WATER_LEVEL_PIN 33
#define WATER_PUMP_PIN 18
#define DHT_PIN 23

#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);

unsigned long previousMillis = 0;
unsigned long interval = 10000;

String readDHTTemperature(){
  float t = dht.readTemperature();

  if (isnan(t)){
    return "--";
  }else{
    return String(t);
  }
}

String readDHTHumidity(){
  int h = dht.readHumidity();

  if (isnan(h)){
    return "--";
  } else{
    return String(h);
  }
}

String readSoilMoisture(){
  int moisture = analogRead(SOIL_MOISTURE_PIN);
  int moistureMapped = map(moisture, 0, 3200, 0, 100);

  if (isnan(moisture))
    return "--";
  else
    return String(moistureMapped);
}

String readWaterLevel(){
  int waterLevel = analogRead(WATER_LEVEL_PIN);
  int waterLevelMapped = map(waterLevel, 0, 4096, 0, 100);

  if (isnan(waterLevel))
    return "--";
  else
    return String(waterLevelMapped);
}

void turnOnWaterPump(){
  digitalWrite(WATER_PUMP_PIN, HIGH);
}

void turnOffWaterPump(){
  digitalWrite(WATER_PUMP_PIN, LOW);
}

bool isPumpTurnedOn() {
  if(digitalRead(WATER_PUMP_PIN) == HIGH) {
    return true;
  }else {
    return false;
  }
}

void handleServerRequest(String request, WiFiClient client) {
  if (request.startsWith("POST /turnOn")) {    
    turnOnWaterPump();
  } else if (request.startsWith("POST /turnOff")) {    
    turnOffWaterPump();
  } else if(request.startsWith("POST /")) {    
    int startIndex = request.indexOf("POST /") + 6;
    int endIndex = request.indexOf(" ", startIndex);
    String fetchValue = request.substring(startIndex, endIndex);

    interval = fetchValue.toInt() * 1000;    
  }

  client.println("HTTP/1.1 200 OK");
  client.println("Access-Control-Allow-Origin: *");
  client.println();
}

void sendToServer(){
  String temperature = readDHTTemperature();
  String humidity = readDHTHumidity();
  String moisture = readSoilMoisture();
  String waterLevel = readWaterLevel();

  WiFiClient client;
  HTTPClient http;
  String url = String(serverUrl);

  http.begin(client, url);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  String body = "temperature=" + temperature + "&humidity=" + humidity + "&moisture=" + moisture + 
  "&waterLevel=" + waterLevel;
  
  int httpResponseCode = http.POST(body);

  if (httpResponseCode == 200){
    Serial.println("Data sent successfully!");
  } else {
    Serial.print("Error sending temperature. Response code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(WATER_PUMP_PIN, OUTPUT);
  dht.begin();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }

  if (MDNS.begin(hostname)) {
    Serial.println("mDNS responder started!");
  } else {
    Serial.println("Error setting up mDNS responder!");
  } 

  Serial.println(WiFi.localIP());

  server.begin();

  MDNS.addService("http", "tcp", 80);
}

void loop() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - previousMillis >= interval && !isPumpTurnedOn() ) {
    sendToServer();
    previousMillis = currentMillis;    
  }

  WiFiClient client = server.available();
  if (client) {
    if (client.available()) {
      String request = client.readStringUntil('\r');
      client.flush();
      
      handleServerRequest(request, client);      
    }
    client.stop();
  }
}
