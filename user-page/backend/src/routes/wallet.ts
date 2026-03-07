import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { WalletService } from '../services/wallet-service.js';

const coinTypeEnum = z.enum(['USDT', 'TRX', 'ETH', 'BTC', 'BNB']);
const networkTypeEnum = z.enum(['TRC20', 'ERC20', 'BEP20', 'BTC']);

// Valid coin-network combinations (see crypto-payment skill)
const VALID_COIN_NETWORKS: Record<string, string[]> = {
  'USDT': ['TRC20', 'ERC20', 'BEP20'],
  'TRX': ['TRC20'],
  'ETH': ['ERC20'],
  'BTC': ['BTC'],
  'BNB': ['BEP20'],
};

const isValidCoinNetwork = (coinType: string, network: string): boolean => {
  const valid = VALID_COIN_NETWORKS[coinType];
  return valid ? valid.includes(network) : false;
};

// Network-specific wallet address validators
const addressValidators: Record<string, RegExp> = {
  'TRC20': /^T[a-zA-Z0-9]{33}$/,
  'ERC20': /^0x[a-fA-F0-9]{40}$/,
  'BEP20': /^0x[a-fA-F0-9]{40}$/,
  'BTC': /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
};

const addAddressSchema = z.object({
  coinType: coinTypeEnum,
  network: networkTypeEnum,
  address: z.string().min(1, '주소를 입력해주세요'),
  label: z.string().max(50, '라벨은 50자 이하로 입력해주세요').optional(),
}).refine((data) => isValidCoinNetwork(data.coinType, data.network), {
  message: '유효하지 않은 코인-네트워크 조합입니다',
  path: ['network'],
}).refine((data) => {
  const regex = addressValidators[data.network];
  return regex ? regex.test(data.address) : false;
}, { message: '유효하지 않은 지갑 주소 형식입니다', path: ['address'] });

const depositSchema = z.object({
  coinType: coinTypeEnum,
  network: networkTypeEnum,
  amount: z.number().positive('입금액은 0보다 커야 합니다'),
}).refine((data) => isValidCoinNetwork(data.coinType, data.network), {
  message: '유효하지 않은 코인-네트워크 조합입니다',
  path: ['network'],
});

const withdrawSchema = z.object({
  coinType: coinTypeEnum,
  network: networkTypeEnum,
  address: z.string().min(1, '출금 주소를 입력해주세요'),
  amount: z.number().positive('출금액은 0보다 커야 합니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
  pin: z.string().regex(/^\d{6}$/, '출금 PIN은 6자리 숫자여야 합니다').default(''),
}).refine((data) => isValidCoinNetwork(data.coinType, data.network), {
  message: '유효하지 않은 코인-네트워크 조합입니다',
  path: ['network'],
}).refine((data) => {
  const regex = addressValidators[data.network];
  return regex ? regex.test(data.address) : false;
}, { message: '유효하지 않은 지갑 주소 형식입니다', path: ['address'] });

const transactionsQuerySchema = z.object({
  type: z.enum(['all', 'deposit', 'withdrawal']).default('all'),
  status: z.enum(['all', 'PENDING', 'APPROVED', 'REJECTED']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const transactionDetailQuerySchema = z.object({
  type: z.enum(['deposit', 'withdrawal']),
});

export default async function walletRoutes(fastify: FastifyInstance) {
  const walletService = new WalletService();

  // GET /api/wallet/balance
  fastify.get(
    '/api/wallet/balance',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const data = await walletService.getBalance(fastify.prisma, userId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get balance error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/wallet/addresses
  fastify.get(
    '/api/wallet/addresses',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const data = await walletService.getAddresses(fastify.prisma, userId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get addresses error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // POST /api/wallet/addresses
  fastify.post(
    '/api/wallet/addresses',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = addAddressSchema.safeParse(request.body);
      if (!parsed.success) {
        const firstError = parsed.error.errors[0];
        return reply.code(400).send({
          success: false,
          error: firstError.message,
        });
      }

      try {
        const userId = request.user.userId;
        const { coinType, network, address, label } = parsed.data;
        const data = await walletService.addAddress(
          fastify.prisma,
          userId,
          coinType,
          network,
          address,
          label,
        );
        return reply.code(201).send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Add address error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // DELETE /api/wallet/addresses/:id
  fastify.delete(
    '/api/wallet/addresses/:id',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const { id } = request.params as { id: string };
        const addressId = parseInt(id, 10);

        if (isNaN(addressId)) {
          return reply.code(400).send({
            success: false,
            error: '유효하지 않은 주소 ID입니다',
          });
        }

        const data = await walletService.deleteAddress(fastify.prisma, userId, addressId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Delete address error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // POST /api/wallet/deposit
  fastify.post(
    '/api/wallet/deposit',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = depositSchema.safeParse(request.body);
      if (!parsed.success) {
        const firstError = parsed.error.errors[0];
        return reply.code(400).send({
          success: false,
          error: firstError.message,
        });
      }

      try {
        const userId = request.user.userId;
        const { coinType, network, amount } = parsed.data;
        const data = await walletService.createDeposit(
          fastify.prisma,
          userId,
          coinType,
          network,
          amount,
        );
        return reply.code(201).send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Create deposit error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/wallet/withdraw-config
  fastify.get(
    '/api/wallet/withdraw-config',
    { preHandler: [fastify.authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        success: true,
        data: {
          fees: {
            'USDT/TRC20': '1', 'USDT/ERC20': '5', 'TRX/TRC20': '0',
            'ETH/ERC20': '0.001', 'BTC/BTC': '0.0001', 'BNB/BEP20': '0.005',
          },
          dailyLimits: {
            USDT: '10000', TRX: '500000', ETH: '5', BTC: '0.5', BNB: '50',
          },
          minWithdraw: {
            USDT: '10', TRX: '100', ETH: '0.01', BTC: '0.001', BNB: '0.1',
          },
        },
      });
    },
  );

  // POST /api/wallet/withdraw
  fastify.post(
    '/api/wallet/withdraw',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = withdrawSchema.safeParse(request.body);
      if (!parsed.success) {
        const firstError = parsed.error.errors[0];
        return reply.code(400).send({
          success: false,
          error: firstError.message,
        });
      }

      try {
        const userId = request.user.userId;
        const { coinType, network, address, amount, password, pin } = parsed.data;
        const data = await walletService.createWithdrawal(
          fastify.prisma,
          fastify.redis,
          userId,
          coinType,
          network,
          address,
          amount,
          password,
          pin,
        );
        return reply.code(201).send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Create withdrawal error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/wallet/transactions
  fastify.get(
    '/api/wallet/transactions',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = transactionsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: '잘못된 조회 파라미터입니다',
        });
      }

      try {
        const userId = request.user.userId;
        const data = await walletService.getTransactions(fastify.prisma, userId, parsed.data);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get transactions error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/wallet/transactions/:id
  fastify.get(
    '/api/wallet/transactions/:id',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const transactionId = parseInt(id, 10);

      if (isNaN(transactionId)) {
        return reply.code(400).send({
          success: false,
          error: '유효하지 않은 거래 ID입니다',
        });
      }

      const queryParsed = transactionDetailQuerySchema.safeParse(request.query);
      if (!queryParsed.success) {
        return reply.code(400).send({
          success: false,
          error: 'type 파라미터가 필요합니다 (deposit 또는 withdrawal)',
        });
      }

      try {
        const userId = request.user.userId;
        const data = await walletService.getTransaction(
          fastify.prisma,
          userId,
          transactionId,
          queryParsed.data.type,
        );
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get transaction detail error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );
}
