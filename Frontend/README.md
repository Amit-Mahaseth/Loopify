# Loopify Frontend

The frontend is a React single-page application built with Vite.

## Technologies

- React and React DOM
- Vite
- React Router
- Axios
- Socket.IO client
- ESLint

## Requirements and startup

Use Node.js and npm versions supported by the Vite version in `package.json`. From the repository root:

```powershell
cd Frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`. Auth and Music backend services must be running to use API-backed features.

## Environment variables

No frontend environment variables are required by the current application. `vite.config.js` contains the development proxy targets. `.env.example` is retained as an example; its optional URL values are not currently read by the frontend or Vite configuration. Do not put secrets in Vite-exposed variables.

## Development proxy

The Vite development server proxies these paths to local backend services:

| Path | Target |
| --- | --- |
| `/api/auth` | `http://localhost:3000` (Auth) |
| `/api/music` | `http://localhost:3002` (Music) |
| `/socket.io` | `http://localhost:3002` (Music, WebSocket enabled) |

These are development proxy settings, not a production reverse proxy.

## Source structure

```text
src/
├── app/                 application entry and route setup
├── features/
│   ├── artists/         artist directory and dashboard
│   ├── auth/            login, registration, password recovery, auth API
│   ├── likes/            liked songs and local likes context
│   ├── music/            home, player, upload, catalog context and API
│   ├── player/           global player and playback context
│   ├── playlists/        playlist pages and API
│   ├── profile/          profile page and API
│   └── theme/            theme context
├── shared/               common UI components and Socket.IO service
├── styles/               global and feature stylesheets
└── index.css             application-level styles
```

Feature `api/` modules hold HTTP request functions. Pages own rendering, local UI state, and handling the API results. Likes reuse the music catalog API; Google sign-in continues as a browser redirect to the Auth service.

## Scripts

Run from `Frontend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build production assets into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

See the [backend guide](../Backend/README.md) for service setup and environment configuration.
