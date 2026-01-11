# PubNub Temp/Humidity Minimal Site

This repository contains a minimal static site that subscribes to a PubNub channel and displays temperature and humidity readings. It's designed to be served by Nginx on an EC2 instance.

## Files
- `index.html` - basic UI + inputs for Subscribe Key and Channel
- `app.js` - subscribes to PubNub and updates the UI
- `styles.css` - styling
- `publish_test.js` - Node script to publish test messages
- `deploy/nginx.pubnub-temp.conf` - example Nginx site config

## Quick test (local)
1. Open `index.html` in your browser (or serve it locally via any static server).
2. The page is prefilled for you: **Subscribe Key** is `sub-c-6902e3d4-a6fe-468b-a673-d410f1cce58b` and **Channel** is `raspi`. Click **Connect**.
3. Run the publisher locally to send messages (the publisher uses environment variables for keys):

   ```bash
   npm install
   PUB_KEY=pub-c-03114af9-d507-41d2-a3bf-b8c857f693da SUB_KEY=sub-c-6902e3d4-a6fe-468b-a673-d410f1cce58b node publish_test.js raspi --loop --interval 5000
   ```

Messages should arrive in the browser and update temperature/humidity using the `temperature_c`/`humidity` fields.

## Deploy to an Ubuntu EC2 instance (minimal)
1. Launch an EC2 instance (Ubuntu 22.04) and open ports 22 and 80 (and 443 if you want HTTPS) in the security group. Consider allocating an Elastic IP so the IP doesn't change.
2. Point your domain DNS (at your registrar or Route53) to the Elastic IP with an A record for `impressiveweb.site` (and optionally `www`).
3. SSH in:

   ```bash
   ssh -i mykey.pem ubuntu@YOUR_EC2_PUBLIC_IP
   sudo apt update && sudo apt install -y nginx
   ```

4. Copy site files to the instance (from your machine):

   ```bash
   scp -i mykey.pem -r ./pubnub-temp-site/* ubuntu@YOUR_IP:~/
   sudo mkdir -p /var/www/pubnub-temp-site
   sudo cp -r ~/pubnub-temp-site/* /var/www/pubnub-temp-site/
   sudo chown -R www-data:www-data /var/www/pubnub-temp-site
   ```

5. Add the site config and enable it (the shipped config already sets `server_name` to `impressiveweb.site`):

   ```bash
   sudo cp ~/pubnub-temp-site/deploy/nginx.pubnub-temp.conf /etc/nginx/sites-available/pubnub-temp
   sudo ln -s /etc/nginx/sites-available/pubnub-temp /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

6. Optional — enable HTTPS with Certbot (recommended):

   ```bash
   sudo snap install core; sudo snap refresh core
   sudo snap install --classic certbot
   sudo ln -s /snap/bin/certbot /usr/bin/certbot
   sudo certbot --nginx -d impressiveweb.site -d www.impressiveweb.site
   ```

7. Visit `https://impressiveweb.site` and connect (or `http://impressiveweb.site` if you haven't enabled HTTPS yet).

## Security notes
- Only put your **Subscribe Key** in the browser. Do NOT expose publish or secret keys in client-side code.
- For publishing from a server, store publish/secret keys in environment variables or a secrets manager (or in a systemd EnvironmentFile outside the served directory).
- To run the publisher on the server with your publish key (keep this private):

   ```bash
   # run publisher on the server (server-side publish key must be kept private)
   PUB_KEY=pub-c-03114af9-d507-41d2-a3bf-b8c857f693da SUB_KEY=sub-c-6902e3d4-a6fe-468b-a673-d410f1cce58b node publish_test.js raspi --loop
   ```

---
If you'd like, I can also:
- Set up HTTPS automatically and verify the certificate
- Add an Express proxy so publish keys never touch the client
- Add a small health check or logging endpoint

Tell me which of these you'd like next. ✅
## Optional: server-side publisher as a systemd service
You can run `publish_test.js` on the server with environment variables and a `systemd` unit to publish sensor data from a trusted server (requires `npm install` on the server).

---
If you'd like, I can also:
- Add a small express server to serve files and proxy keys securely
- Add HTTPS with Certbot and a domain
- Add a small health check or logging endpoint

Tell me which of these you'd like next. ✅