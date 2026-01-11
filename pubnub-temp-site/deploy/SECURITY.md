# Security notes

- **Never embed your Publish or Secret keys in client-side code.** Only the Subscribe Key is fine for the browser UI.
- For server-side publishers, store sensitive keys in environment variables or a secrets manager. Use systemd EnvironmentFile or a `.env` file outside of served directories.
- Limit access to your EC2 instance via Security Groups and SSH keys. Only open necessary ports (80/443) to the world.
- Use HTTPS (Certbot + nginx) before moving to production.
