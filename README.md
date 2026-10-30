# Loopify

![Loopify logo](Frontend/public/logo.png)

Loopify is a music streaming application for discovering and playing music, managing playlists and liked songs, and publishing music as an artist.

## Features

- Browse the music catalog, artists, and playlists; play tracks with a shared player and queue.
- Save liked songs and theme preference in the browser.
- Register, sign in with email or Google, recover passwords, and manage a profile.
- Upload music and cover art and manage artist playlists.
- Synchronize playback commands between authenticated devices.

## Technology

- **Frontend:** React, Vite, React Router, Axios, Socket.IO client
- **Backend:** Node.js, Express, MongoDB/Mongoose
- **Media:** AWS S3 with presigned URLs
- **Messaging and email:** RabbitMQ and Nodemailer
- **Auth:** JWT cookies and Google OAuth

## Architecture

The React frontend talks to separate Auth and Music services. Music also serves Socket.IO playback events. Auth publishes registration events to RabbitMQ, which the Notification service consumes to send welcome email.

```text
Frontend/
  src/app/       app entry and routing
  src/features/  auth, music, artists, playlists, likes, profile, player, theme
  src/shared/    reusable components and socket service
Backend/
  Auth/          accounts, authentication, and profiles
  Music/         catalog, playlists, uploads, and playback sockets
  Notification/  registration email worker
```

## Prerequisites

- Node.js and npm (use a version supported by the installed Vite release)
- MongoDB for Auth and Music
- RabbitMQ for Auth and Notification
- AWS S3 credentials for music uploads and playback
- Google OAuth and Gmail OAuth credentials for the corresponding sign-in and email features

## Run locally

There is no root install or orchestration script. In each service directory, copy `.env.example` to `.env`, fill in the required values, then install dependencies and start the service:

```powershell
cd Backend/Auth
npm install
npm run dev
```

Repeat from `Backend/Music` and `Backend/Notification`. In another terminal, start the frontend:

```powershell
cd Frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`. The development proxy forwards `/api/auth` to port `3000`, `/api/music` and `/socket.io` to port `3002`. Service configuration and required variables are documented in the backend guide.

## Docker Compose (development)

`docker compose up --build` starts all services. Configure each backend `.env` first; MongoDB, Redis, and RabbitMQ must be reachable from the containers (container `localhost` does not refer to your host machine). The Frontend image serves a production build with Nginx and proxies `/api/auth`, `/api/music`, and `/socket.io`. It uses `PORT=10000`, `AUTH_API_URL=http://auth:3000`, and `MUSIC_API_URL=http://music:3002` locally.

## Deploying

Deploy Auth and Music as separate web services, then deploy Frontend with its Dockerfile. The frontend proxy keeps API, cookie, and Socket.IO traffic on the frontend origin, which is required for reliable HTTP-only session cookies.

Set these environment variables in the deployment dashboard:

| Service | Required deployment settings |
| --- | --- |
| Frontend | `AUTH_API_URL` = public Auth service URL; `MUSIC_API_URL` = public Music service URL; `PORT` = platform-provided port |
| Auth | `FRONTEND_URL` = public Frontend URL; `GOOGLE_CALLBACK_URL` = `https://<frontend-domain>/api/auth/google/callback`; Auth database, JWT, Redis, RabbitMQ, and Google credentials |
| Music | `FRONTEND_URL` = public Frontend URL; the same `JWT_SECRET` as Auth; Music database and AWS/S3 credentials |

In Google Cloud Console, add the exact `GOOGLE_CALLBACK_URL` above as an authorized redirect URI. Do not use an internal Docker hostname, `localhost`, or the Auth service URL for that callback when the frontend proxy handles browser traffic.

The frontend intentionally uses relative `/api/...` URLs in production. Do not set browser-exposed `VITE_AUTH_API_URL` or `VITE_MUSIC_API_URL` to internal service URLs.

## Guides

- [Frontend setup and architecture](Frontend/README.md)
- [Backend services and configuration](Backend/README.md)

## Project

Maintained by [Amit Mahaseth](https://github.com/Amit-Mahaseth). Visit [Amit-Mahaseth/Loopify](https://github.com/Amit-Mahaseth/Loopify) for the repository.
