# Loopify

Loopify is a Node.js application currently split into two services: an authentication API and a notification service. The services communicate through RabbitMQ. This document is the project documentation index and should be updated whenever the codebase or a feature changes.

## Repository structure

```text
Loopify/
├── read.md                     # Project overview, service map, and documentation rules
├── Auth/                       # Authentication API service
│   ├── server.js               # Service startup and dependency connections
│   ├── package.json            # Scripts and dependencies
│   ├── src/
│   │   ├── app.js              # Express middleware, Passport, and route registration
│   │   ├── brokers/            # RabbitMQ connection and message publishing
│   │   ├── config/             # Environment configuration
│   │   ├── controllers/        # Authentication request handlers
│   │   ├── db/                 # MongoDB connection
│   │   ├── middlewares/        # Authentication, validation, and rate limiting
│   │   ├── models/             # Authentication data models
│   │   └── routes/             # Authentication HTTP endpoints
│   └── tests/                  # Authentication tests and test helpers
└── Notification/               # Email notification service
    ├── server.js               # Service startup and listener initialization
    ├── package.json            # Scripts and dependencies
    └── src/
        ├── app.js              # Express application
        ├── brokers/            # RabbitMQ connection, consumer, and event handling
        ├── config/             # Environment configuration
        └── utils/               # Email delivery helper
```

`node_modules/`, package lock files, and local `.env` files are omitted from the tree because they are generated, dependency metadata, or machine-specific configuration. Never add secret values to this document or commit real credentials.

## Services and current behavior

### Auth

- Express API, started by `Auth/server.js` on port `3000`.
- Connects to MongoDB and RabbitMQ at startup.
- Routes are mounted under `/api/auth`.
- Current routes include registration, login, Google OAuth initiation, and Google OAuth callback (`Auth/src/routes/auth.routes.js`).
- Uses request validation and rate-limiting middleware. Authentication events are published through RabbitMQ by the service broker.
- Jest tests live under `Auth/tests/`.

### Notification

- Email notification worker, started by `Notification/server.js`; its Express app currently has no routes.
- Connects to RabbitMQ and listens for `user_registered` and `user_logged_in` messages.
- Builds and sends email notifications using the email utility.

### Message flow

```text
Auth API ── publishes event ──> RabbitMQ ── delivers event ──> Notification worker ──> Email provider
```

Queue names and payload schemas are part of the service contract. When changing an event, update the publisher, consumer, and documentation together.

## Local development

Use a supported Node.js release and ensure MongoDB, RabbitMQ, and the configured email provider are available. Install dependencies in each service directory:

```powershell
cd Auth
npm install
npm run dev
```

In a separate terminal, run the notification service:

```powershell
cd Notification
npm install
npm run dev
```

Run the authentication test suite from `Auth/` with `npm test`. The Notification package currently has no configured test suite.

## Configuration

Create local `.env` files in the service directories. Keep actual values private and use a secrets manager or deployment environment for production. Configuration keys currently read by the code are:

| Service | Environment keys |
| --- | --- |
| Auth | `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `RABBITMQ_URI` |
| Notification | `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `GOOGLE_REFRESH_TOKEN`, `EMAIL_USER`, `RABBITMQ_URI` |

Document the purpose and required status of new configuration keys here when adding them. Do not document secret values.

## Documentation maintenance standard

Keep this file accurate as code changes. For every feature or structural change:

1. Update the repository tree when files or folders are added, removed, or moved.
2. Record the feature under the owning service, including its responsibility and relevant entry points.
3. Document changed API routes, event names, queue payload fields, configuration keys, and user-visible behavior where applicable.
4. Update setup or run instructions if commands, ports, dependencies, or service requirements change.
5. Keep examples free of credentials and use consistent Markdown headings, lists, tables, and fenced code blocks.
6. Remove stale documentation when behavior is deleted or replaced.

For substantial features, add a focused document under a service-specific `docs/` directory and link it here. Keep detailed API, event, and operational references close to their owning service; use this file as the concise project index.

## Known documentation follow-ups

- Add an API reference with request and response schemas, status codes, and authentication requirements.
- Define RabbitMQ event payload schemas and delivery/retry behavior.
- Document deployment, health checks, logging, and production configuration once those conventions are established.
