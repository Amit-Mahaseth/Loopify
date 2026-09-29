import app from './src/app.js'
import { ConnectToRabbitMQ } from './src/brokers/rabbitmq.js'
import StartListener from './src/brokers/listener.js'  

ConnectToRabbitMQ().then(StartListener).catch((err)=>{
    console.error('Error connecting to RabbitMQ:', err)
})

app.listen(3001,()=>{
    console.log('Notification Service is Running on Port 3001')
})