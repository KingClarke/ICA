// PubNub subscriber for temp/humidity — STATIC MODE
// This page connects directly to PubNub and displays readings from the `raspi` channel.

const tempEl = document.getElementById('temp');
const humEl = document.getElementById('hum');
const timeEl = document.getElementById('time');
const statusEl = document.getElementById('status-text');

// Edit these values directly in this file if you want to change them.
const SUB_KEY = 'sub-c-6902e3d4-a6fe-468b-a673-d410f1cce58b';
const CHANNEL = 'raspi';
// If your token endpoint requires an API key, set it here (optional)
const TOKEN_API_KEY = null; // e.g. 'sec-c-...'

let pubnub = null;
let webUuid = null;
let refreshTimer = null;
const DEFAULT_REFRESH_MS = 50 * 60 * 1000; // 50 minutes

function formatTime(d) {
  return new Date(d).toLocaleString();
}

function onMessage(m) {
  const msg = m.message;
  if (!msg) return;

  if (msg.temperature_c !== undefined) tempEl.textContent = (Math.round(msg.temperature_c * 10) / 10) + ' °C';
  else tempEl.textContent = '—';

  if (msg.humidity !== undefined) humEl.textContent = (Math.round(msg.humidity * 10) / 10) + ' %';
  else humEl.textContent = '—';

  const t = msg.timestamp ? (parseFloat(msg.timestamp) * 1000) : Date.now();
  timeEl.textContent = formatTime(t);

  if (msg.uuid) {
    let idEl = document.getElementById('device-id');
    if (!idEl) {
      idEl = document.createElement('p');
      idEl.id = 'device-id';
      document.querySelector('.meta').appendChild(idEl);
    }
    idEl.textContent = 'Device: ' + msg.uuid;
  }
}

function onStatus(s) {
  console.log('PubNub status:', s);
  if (s && s.category) {
    if (s.category === 'PNConnectedCategory' || s.category === 'PNReconnectedCategory') {
      statusEl.textContent = 'connected';
    } else if (s.category === 'PNAccessDeniedCategory') {
      statusEl.textContent = 'access denied (403) — PubNub is blocking the subscription';
    } else {
      statusEl.textContent = s.category || 'error';
    }
  }
}

async function fetchToken(uuid) {
  const headers = {};
  if (TOKEN_API_KEY) headers['X-API-Key'] = TOKEN_API_KEY;
  const res = await fetch(`/get-token/${encodeURIComponent(uuid)}`, { headers });
  if (!res.ok) throw new Error('token fetch failed: ' + res.status);
  return res.json(); // expect { token, ttl }
}

function cleanupPubNub() {
  if (pubnub) {
    try { pubnub.unsubscribeAll(); pubnub.removeListener({ message: onMessage, status: onStatus }); } catch (e) { }
    pubnub = null;
  }
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
}

async function connectWithToken() {
  webUuid = 'web-client-' + Math.random().toString(36).slice(2);
  updateStatus('requesting token...');
  try {
    const data = await fetchToken(webUuid);
    const token = data.token;
    const ttl = data.ttl || 3600;
    updateStatus('connecting with token...');

    cleanupPubNub();
    pubnub = new PubNub({ subscribeKey: SUB_KEY, uuid: webUuid, authKey: token });
    pubnub.addListener({ message: onMessage, status: onStatus });
    pubnub.subscribe({ channels: [CHANNEL] });

    // schedule token refresh slightly before expiry
    const refreshMs = Math.max((ttl - 60) * 1000, DEFAULT_REFRESH_MS);
    refreshTimer = setTimeout(async function refreshFn() {
      try {
        updateStatus('refreshing token...');
        const refreshed = await fetchToken(webUuid);
        const newToken = refreshed.token;
        pubnub.setAuthKey(newToken);
        updateStatus('token refreshed');
        // reschedule
        const newTtl = refreshed.ttl || ttl;
        refreshTimer = setTimeout(refreshFn, Math.max((newTtl - 60) * 1000, DEFAULT_REFRESH_MS));
      } catch (e) {
        console.error('token refresh failed', e);
        updateStatus('token refresh failed');
      }
    }, refreshMs);

  } catch (e) {
    console.error('token flow failed:', e);
    updateStatus('token fetch failed — falling back to direct subscribe');
    // fallback: attempt direct subscription using SUB_KEY (if keyset allows it)
    try { connectDirect(); } catch (err) { updateStatus('direct subscribe failed'); }
  }
}

function connectDirect() {
  cleanupPubNub();
  updateStatus('connecting directly...');
  pubnub = new PubNub({ subscribeKey: SUB_KEY, uuid: 'web-client-' + Math.random().toString(36).slice(2) });
  pubnub.addListener({ message: onMessage, status: onStatus });
  pubnub.subscribe({ channels: [CHANNEL] });
}

function updateStatus(msg) { if (statusEl) statusEl.textContent = msg; }

// Start token flow on load
connectWithToken();
