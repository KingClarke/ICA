/*
  Simple PubNub publisher for testing
  Usage (safe): set PUB_KEY and SUB_KEY via env or pass via args.
  Example: PUB_KEY=pub-xxx SUB_KEY=sub-xxx node publish_test.js my-channel
  Or to run continuous publishes: node publish_test.js my-channel --loop --interval 5000
*/

const PubNub = require('pubnub');
const argv = require('minimist')(process.argv.slice(2));

const channel = argv._[0] || 'test-temp';
const loop = argv.loop || false;
const interval = argv.interval ? parseInt(argv.interval) : 5000;

const pubKey = process.env.PUB_KEY || process.env.PUBNUB_PUBLISH_KEY;
const subKey = process.env.SUB_KEY || process.env.PUBNUB_SUBSCRIBE_KEY;
const secret = process.env.SECRET_KEY || process.env.PUBNUB_SECRET_KEY;

if (!pubKey || !subKey) {
  console.error('Please set PUB_KEY and SUB_KEY environment variables.');
  process.exit(1);
}

const pubnub = new PubNub({
  publishKey: pubKey,
  subscribeKey: subKey,
  secretKey: secret // not needed for basic publish; keep for server-side use only
});

function sendOnce() {
  const msg = {
    temp: Math.round((20 + Math.random() * 10) * 10) / 10,
    humidity: Math.round((30 + Math.random() * 40) * 10) / 10,
    ts: Date.now()
  };
  pubnub.publish({ channel, message: msg }, (status, resp) => {
    if (status.error) console.error('Publish error', status);
    else console.log('Published', msg, '->', channel);
  });
}

if (loop) {
  sendOnce();
  setInterval(sendOnce, interval);
} else {
  sendOnce();
}
