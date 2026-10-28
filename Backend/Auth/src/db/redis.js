
import { createClient } from 'redis';
import Config from '../config/config.js';

const redisClient = createClient({
    ...(Config.REDIS_PASSWORD && {
        username: Config.REDIS_USERNAME,
        password: Config.REDIS_PASSWORD,
    }),
    socket: {
        host: Config.REDIS_HOST,
        port: Config.REDIS_PORT,
        tls: Config.REDIS_TLS,
    },
});

redisClient.on('error', (err) => {
    console.error('Redis Error:', err.message);
});

export default redisClient;
