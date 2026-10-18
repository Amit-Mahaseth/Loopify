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

## Guides

- [Frontend setup and architecture](Frontend/README.md)
- [Backend services and configuration](Backend/README.md)

## License and author

This project is available under the [ISC License](LICENSE). Maintained by [Amit Mahaseth](https://github.com/Amit-Mahaseth); visit [Amit-Mahaseth/Loopify](https://github.com/Amit-Mahaseth/Loopify) for the repository.
