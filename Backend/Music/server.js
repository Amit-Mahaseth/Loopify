
import app from './src/app.js'
import ConnectToDB from './src/db/db.js'
import InitateSocketServer from './src/Sockets/socket.server.js'
import http from 'http'

const httpserver=http.createServer(app)
InitateSocketServer(httpserver)
const PORT = Number(process.env.PORT) || 3002
try {
    await ConnectToDB()
    httpserver.listen(PORT,"0.0.0.0", () => {
        console.log(`Music service running on port ${PORT}`)
    })
} catch (err) {
    console.error('Music service startup failed:', err)
    throw err
}
