import dns from 'dns'
dns.setServers(['8.8.8.8', '1.1.1.1'])

import app from './src/app.js'
import ConnectToDB from './src/db/db.js'
import { ConnectToRabbitMQ } from './src/brokers/rabbitmq.js'
import redisClient from "./src/db/redis.js"

await ConnectToRabbitMQ()
await redisClient.connect()
console.log("Redis Connected Successfully");

try {
  await ConnectToDB()
  app.listen(3000, () => {
    console.log('Auth Server is running on port 3000')
  })
} catch (error) {
  console.error('MongoDB connection failed:', error.message)
  process.exit(1)
}