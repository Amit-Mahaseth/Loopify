
import app from './src/app.js'
import ConnectToDB from './src/db/db.js'
import { ConnectToRabbitMQ } from './src/brokers/rabbitmq.js'
import redisClient from "./src/db/redis.js"

try {
  await ConnectToRabbitMQ()
  await redisClient.connect()
  await ConnectToDB()
  app.listen(3000,"0.0.0.0")
} catch (err) {
  console.error('Auth service startup failed:', err)
  throw err
}