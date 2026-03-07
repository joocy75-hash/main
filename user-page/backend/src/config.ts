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
  cookie: {
    secure: (process.env.NODE_ENV || 'development') === 'production',
    sameSite: 'strict' as const,
    httpOnly: true,
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
  payment: {
    provider: (process.env.PAYMENT_PROVIDER || 'cryptomus') as 'heleket' | 'cryptomus',
    webhookBaseUrl: process.env.WEBHOOK_BASE_URL || 'http://localhost:8003',
    heleket: {
      apiKey: process.env.HELEKET_API_KEY || '',
      merchantId: process.env.HELEKET_MERCHANT_ID || '',
      baseUrl: 'https://api.heleket.com/v1',
    },
    cryptomus: {
      paymentKey: process.env.CRYPTOMUS_PAYMENT_KEY || '',
      payoutKey: process.env.CRYPTOMUS_PAYOUT_KEY || '',
      merchantId: process.env.CRYPTOMUS_MERCHANT_ID || '',
      baseUrl: 'https://api.cryptomus.com/v1',
    },
  },
  gamblly: {
    apiKey: process.env.GAMBLLY_API_KEY || '',
    playerPrefix: process.env.GAMBLLY_PLAYER_PREFIX || '',
    serverUrl: process.env.GAMBLLY_SERVER_URL || 'https://game.gamblly-api.com/production',
  },
} as const;
