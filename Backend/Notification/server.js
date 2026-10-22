import app from './src/app.js'
import { ConnectToRabbitMQ } from './src/brokers/rabbitmq.js'
import StartListener from './src/brokers/listener.js'  

try {
    await ConnectToRabbitMQ()
    await StartListener()
    app.listen(3001,"0.0.0.0")
} catch (err) {
    console.error('Error starting Notification service:', err)
    throw err
}