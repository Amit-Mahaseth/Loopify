
import app from './src/app.js'
import ConnectToDB from './src/db/db.js'
import { ConnectToRabbitMQ } from './src/brokers/rabbitmq.js'
import redisClient from "./src/db/redis.js"

try {
  await ConnectToRabbitMQ()
  await redisClient.connect()
  await ConnectToDB()
 const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Auth service running on port ${PORT}`);
});
} catch (err) {
  console.error('Auth service startup failed:', err)
  throw err
}