
import requests
from pubnub.pubnub import PubNub
from pubnub.pnconfiguration import PNConfiguration
import time
import math
import adafruit_dht
import board
from gpiozero import LED

# Config
EC2_SERVER = "http://AWS:4999" #
PI_UUID = "raspi-02"
CHANNEL = "raspi"
TOKEN_REFRESH_INTERVAL = 50 * 60 # 50 min

# LED settings
led = LED(17)
led.on()

# LED function
def led_flash(times=4, speed=0.1):
    for _ in range(times):
        led.on()
        time.sleep(speed)
        led.off()
        time.sleep(speed)

dht = adafruit_dht.DHT11(board.D4, use_pulseio=False)

# Token function
def get_write_token():
    resp = requests.get(f"{EC2_SERVER}/get-token/{PI_UUID}")
    resp.raise_for_status()
    return resp.json()["token"]

# Pubnub init
token = get_write_token()

pnconfig = PNConfiguration()
pnconfig.subscribe_key = "SUB" #
pnconfig.publish_key = "PUB" #
pnconfig.uuid = PI_UUID
pnconfig.auth_key = token
pnconfig.ssl = True

pubnub = PubNub(pnconfig)


# Main loop
last_refresh = time.time()


while True:
    # Token auto-refresh
    if time.time() - last_refresh > TOKEN_REFRESH_INTERVAL:
        print("Refreshing token...")
        token = get_write_token()
        pubnub.set_auth_key(token)
        last_refresh = time.time()
        print("Token refreshed!")

    try:
        temperature = dht.temperature
        humidity = dht.humidity
        if temperature is not None:
            if temperature < 8:
                led.on()
            elif temperature > 18:
                led_flash()
            else:
                led.off()
    except RuntimeError as e:
        print("DHT read error:", e)
        time.sleep(0.75)
        continue

    message = {
    "uuid": PI_UUID,
    "temperature_c": temperature,
    "humidity": humidity,
    "timestamp": time.time()
    }

    print("Sending:", message)

    pubnub.publish().channel(CHANNEL).message(message).sync()
    time.sleep(1)









