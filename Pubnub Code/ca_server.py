from flask import Flask, jsonify
from pubnub.pubnub import PubNub
from pubnub.pnconfiguration import PNConfiguration
from pubnub.models.consumer.v3.channel import Channel
from pubnub.models.consumer.v3.group import Group
from pubnub.models.consumer.v3.uuid import UUID
import os

app = Flask(__name__)


# PubNub config
pnconfig = PNConfiguration()
pnconfig.subscribe_key = "SUB"
pnconfig.publish_key = "PUB"
pnconfig.secret_key = "SEC"
pnconfig.uuid = "ec2-server"
pnconfig.ssl = True

pubnub = PubNub(pnconfig)

CHANNEL_NAME = "raspi"

# Flask route
@app.route("/get-token/<pi_uuid>")
def get_token(pi_uuid):
    try:
        # Define channel permissions
        channels = [
            Channel.id(CHANNEL_NAME).read().write()
        ]

        channel_groups = []
        uuids = [
            UUID.id(pi_uuid).get(),
        ]

        # Grant the token
        envelope = pubnub.grant_token() \
            .authorized_uuid(pi_uuid) \
            .channels(channels) \
            .groups(channel_groups) \
            .uuids(uuids) \
            .ttl(60) \
            .sync()

        token = envelope.result.token
        print(f"Granted token for {pi_uuid}: {token}")
        return jsonify({"token": token})
    except Exception as e:
        print("Error generating token:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Listen on all interfaces
    app.run(host="0.0.0.0", port=4999)
