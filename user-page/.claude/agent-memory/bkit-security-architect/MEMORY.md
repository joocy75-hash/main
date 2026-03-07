# Security Architect Memory

## Project: user-page
- **Stack**: Fastify 5 + Next.js 16 + Prisma 6 + PostgreSQL + Redis
- **Type**: Gaming platform with crypto wallet (USDT/TRX/ETH/BTC/BNB)
- **Auth**: JWT HS256 via httpOnly cookies + Redis blacklist
- **CSRF**: Custom X-Requested-With header check
- **Payment**: Cryptomus/Heleket dual provider with webhook signature verification

## Audit History
- **2026-03-08**: Full OWASP Top 10 audit completed. See `audit-2026-03-08.md`

## Key Security Patterns
- Wallet service uses `SELECT ... FOR UPDATE` + `$transaction` for balance ops
- Webhook deposit/withdrawal use `updateMany` with status guard (WHERE status='PENDING')
- Password brute-force: Redis counter + 15min lockout after 5 attempts
- Token rotation: Refresh tokens blacklisted on use
- .env files in .gitignore (confirmed)
