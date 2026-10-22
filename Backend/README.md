# Loopify Backend

The backend contains three independent Node.js ES module services. Install and run each service from its own directory.

## Services

| Service | Default port | Responsibility |
| --- | ---: | --- |
| Auth | 3000 | Registration, login, Google OAuth, password recovery, profiles, and JWT cookies; publishes registration events |
| Music | 3002 | Music catalog, artist uploads, playlists, S3 media storage, and Socket.IO playback synchronization |
| Notification | 3001 | Consumes registration events from RabbitMQ and sends welcome email |

## Prerequisites

- Node.js and npm
- MongoDB for Auth and Music
- RabbitMQ for Auth and Notification
- An AWS account and S3 bucket named `loopify-bucket` for music storage
- Google OAuth credentials for Google sign-in; Gmail OAuth credentials for email

## Environment setup

Each service has an `.env.example`. Copy it to `.env` in that service directory and replace the example values with local credentials. Never commit `.env` files.

- **Auth:** MongoDB URI, Redis URI, JWT secret, Google OAuth client ID/secret and callback URL, frontend redirect URL, RabbitMQ URI, and email account/refresh token. MongoDB, Redis, and RabbitMQ must be reachable before Auth starts.
- **Music:** MongoDB URI, JWT secret, AWS access ID, AWS secret access key, AWS region, and the frontend origin (`FRONTEND_URL`) for CORS and Socket.IO.
- **Notification:** RabbitMQ URI and email account/Google refresh token. Its sample also lists Google OAuth configuration values.

See each service's `.env.example` for variable names and local examples. Configure the Google callback as `http://localhost:3000/api/auth/google/callback` for local development and register the same URL with the Google OAuth client.

## Install and start

From a separate terminal for each service:

```powershell
cd Backend/Auth
npm install
npm run dev
```

Repeat from `Backend/Music` and `Backend/Notification`. `npm start` runs a service without nodemon. Auth and Music have Jest test scripts; Notification's test script is currently a placeholder.

The frontend proxies Auth at port `3000`, Music at port `3002`, and Music Socket.IO at port `3002` during development. See the [frontend guide](../Frontend/README.md) for setup.
