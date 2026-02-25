import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '8003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://userpage:secret@localhost:5435/user_page_db',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6381',
  jwt: {
    secret: (() => {
      const s = process.env.JWT_SECRET;
      if (!s && (process.env.NODE_ENV || 'development') === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
      }
      return s || 'dev-jwt-secret-change-in-production';
    })(),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3002,http://localhost:3001')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  admin: {
    apiUrl: process.env.ADMIN_API_URL || 'http://localhost:8002',
    serviceToken: (() => {
      const t = process.env.ADMIN_SERVICE_TOKEN;
      if (!t && (process.env.NODE_ENV || 'development') === 'production') {
        throw new Error('ADMIN_SERVICE_TOKEN environment variable is required in production');
      }
      return t || 'user-page-service-token-2026';
    })(),
  },
  pandaScore: {
    apiKey: process.env.PANDASCORE_API_KEY || '',
    baseUrl: 'https://api.pandascore.co',
  },
  apiFootball: {
    apiKey: process.env.API_FOOTBALL_KEY || '',
    baseUrl: 'https://v3.football.api-sports.io',
  },
} as const;
