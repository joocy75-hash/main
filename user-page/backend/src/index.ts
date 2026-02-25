import Fastify from 'fastify';
import { config } from './config.js';

// Plugins
import prismaPlugin from './plugins/prisma.js';
import redisPlugin from './plugins/redis.js';
import corsPlugin from './plugins/cors.js';
import authPlugin from './plugins/auth.js';
import rateLimitPlugin from './middleware/rate-limit.js';

// Routes
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/games.js';
import walletRoutes from './routes/wallet.js';
import eventRoutes from './routes/events.js';
import sportsRoutes from './routes/sports.js';
import profileRoutes from './routes/profile.js';
import minigameRoutes from './routes/minigame.js';

const app = Fastify({
  logger: config.nodeEnv === 'development'
    ? { level: 'info' }
    : { level: 'warn' },
});

// Register plugins (order matters)
await app.register(corsPlugin);
await app.register(prismaPlugin);
await app.register(redisPlugin);
await app.register(authPlugin);
await app.register(rateLimitPlugin);

// Register routes
await app.register(healthRoutes);
await app.register(authRoutes);
await app.register(gameRoutes);
await app.register(walletRoutes);
await app.register(eventRoutes);
await app.register(sportsRoutes);
await app.register(profileRoutes);
await app.register(minigameRoutes);

// Start server
const start = async () => {
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
