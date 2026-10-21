
import app from './src/app.js'
import ConnectToDB from './src/db/db.js'
import InitateSocketServer from './src/Sockets/socket.server.js'
import http from 'http'

const httpserver=http.createServer(app)
InitateSocketServer(httpserver)
ConnectToDB()


 

httpserver.listen(3002,"0.0.0.0",()=>{
    console.log('Server is Running on Port 3002')
})