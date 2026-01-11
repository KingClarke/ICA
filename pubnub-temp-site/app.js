// PubNub subscriber for temp/humidity
// Usage: enter your SUBSCRIBE_KEY and CHANNEL in the inputs and click Connect

const tempEl = document.getElementById('temp');
const humEl = document.getElementById('hum');
const timeEl = document.getElementById('time');
const connectBtn = document.getElementById('connect');
const subKeyInput = document.getElementById('subkey');
const channelInput = document.getElementById('channel');

let pubnub = null;

function formatTime(d) {
  return new Date(d).toLocaleString();
}

function onMessage(m) {
  // Expect message payload like:
  // { "uuid": "PI_UUID", "temperature_c": 23.4, "humidity": 45, "timestamp": 167... }
  const msg = m.message;
  if (!msg) return;

  // Temperature (from temperature_c)
  if (msg.temperature_c !== undefined) tempEl.textContent = (Math.round(msg.temperature_c * 10) / 10) + ' °C';
  else tempEl.textContent = '—';

  // Humidity
  if (msg.humidity !== undefined) humEl.textContent = (Math.round(msg.humidity * 10) / 10) + ' %';
  else humEl.textContent = '—';

  // Use message timestamp if provided (seconds since epoch), otherwise use now
  const t = msg.timestamp ? (parseFloat(msg.timestamp) * 1000) : Date.now();
  timeEl.textContent = formatTime(t);

  // Show device UUID in the meta area if present
  const meta = document.querySelector('.meta');
  if (msg.uuid) {
    let idEl = document.getElementById('device-id');
    if (!idEl) {
      idEl = document.createElement('p');
      idEl.id = 'device-id';
      meta.appendChild(idEl);
    }
    idEl.textContent = 'Device: ' + msg.uuid;
  }
}

function connect() {
  const subKey = subKeyInput.value.trim();
  const channel = channelInput.value.trim();
  if (!subKey || !channel) {
    alert('Enter a Subscribe Key and Channel');
    return;
  }

  if (pubnub) {
    pubnub.unsubscribeAll();
    pubnub.removeListener({ message: onMessage });
    pubnub = null;
  }

  pubnub = new PubNub({
    subscribeKey: subKey,
    uuid: 'web-client-' + Math.random().toString(36).slice(2)
  });

  pubnub.addListener({ message: onMessage });
  pubnub.subscribe({ channels: [channel] });

  connectBtn.textContent = 'Connected';
  connectBtn.disabled = true;
}

connectBtn.addEventListener('click', connect);

// Optional: allow configure via URL ?subkey=...&channel=...
(function loadFromUrl() {
  const params = new URLSearchParams(location.search);
  if (params.get('subkey')) subKeyInput.value = params.get('subkey');
  if (params.get('channel')) channelInput.value = params.get('channel');
  if (subKeyInput.value && channelInput.value) {
    // auto-connect
    connect();
  }
})();