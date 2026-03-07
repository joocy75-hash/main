import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Prisma } from '@prisma/client';
import {
  getCryptomus,
  getHeleket,
  normalizePaymentStatus,
  normalizePayoutStatus,
} from '../services/payment-provider.js';
import { config } from '../config.js';

interface WebhookBody {
  type?: string;
  uuid: string;
  order_id: string;
  amount: string;
  payment_amount?: string;
  payment_amount_usd?: string;
  merchant_amount?: string;
  commission?: string;
  is_final: boolean;
  status: string;
  from?: string;
  network?: string;
  currency?: string;
  payer_currency?: string;
  txid?: string;
  sign: string;
  additional_data?: string;
  [key: string]: unknown;
}

export default async function webhookRoutes(fastify: FastifyInstance) {
  // Disable content type parsing for raw body access if needed
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      const json = JSON.parse(body as string);
      done(null, json);
    } catch (err: any) {
      done(err, undefined);
    }
  });

  // ==========================================
  // POST /api/webhooks/deposit
  // Called by Heleket/Cryptomus when deposit status changes
  // ==========================================
  fastify.post(
    '/api/webhooks/deposit',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as WebhookBody;

      if (!body || !body.uuid || !body.sign) {
        return reply.code(400).send({ error: 'Invalid webhook payload' });
      }

      // Verify signature based on active provider
      const providerName = config.payment.provider;
      let signValid = false;

      if (providerName === 'heleket') {
        signValid = getHeleket().verifyWebhook(body as any, body.sign);
      } else {
        signValid = getCryptomus().verifyPaymentWebhook(body as any, body.sign);
      }

      if (!signValid) {
        fastify.log.warn({ uuid: body.uuid }, 'Deposit webhook: invalid signature');
        return reply.code(403).send({ error: 'Invalid signature' });
      }

      fastify.log.info({
        uuid: body.uuid,
        status: body.status,
        amount: body.payment_amount,
        txid: body.txid,
      }, 'Deposit webhook received');

      // Find deposit by provider UUID
      const deposit = await fastify.prisma.deposit.findUnique({
        where: { providerUuid: body.uuid },
      });

      if (!deposit) {
        fastify.log.warn({ uuid: body.uuid }, 'Deposit webhook: deposit not found');
        return reply.send({ success: true }); // ack to prevent retries
      }

      // Already finalized, skip
      if (deposit.status !== 'PENDING') {
        return reply.send({ success: true });
      }

      const newStatus = normalizePaymentStatus(body.status);

      if (newStatus === 'APPROVED') {
        // Deposit confirmed - credit user balance
        await fastify.prisma.$transaction(async (tx) => {
          // Atomic status guard: prevents double-credit from concurrent webhooks
          const updated = await tx.deposit.updateMany({
            where: { id: deposit.id, status: 'PENDING' },
            data: {
              status: 'APPROVED',
              txHash: body.txid || null,
              paymentAmount: body.payment_amount
                ? new Prisma.Decimal(body.payment_amount)
                : null,
              merchantAmount: body.merchant_amount
                ? new Prisma.Decimal(body.merchant_amount)
                : null,
              fromAddress: body.from || null,
              processedAt: new Date(),
            },
          });
          if (updated.count === 0) return;

          // Credit user balance (use merchant_amount if available, else original amount)
          const creditAmount = deposit.amount;
          const updatedUser = await tx.user.update({
            where: { id: deposit.userId },
            data: { balance: { increment: creditAmount } },
            select: { balance: true },
          });

          // Money log
          await tx.moneyLog.create({
            data: {
              userId: deposit.userId,
              type: 'deposit',
              amount: creditAmount,
              balanceAfter: updatedUser.balance,
              description: `${deposit.coinType} 입금 완료 (${deposit.network})`,
              referenceId: `deposit_${deposit.id}`,
            },
          });

          // Send system message
          await tx.message.create({
            data: {
              userId: deposit.userId,
              type: 'transaction',
              title: '입금 완료',
              content: `${deposit.amount} ${deposit.coinType} 입금이 승인되었습니다.`,
              isRead: false,
            },
          });
        });

        fastify.log.info({
          depositId: deposit.id,
          userId: deposit.userId,
          amount: deposit.amount.toString(),
        }, 'Deposit approved via webhook');
      } else if (newStatus === 'REJECTED') {
        // Deposit failed/cancelled
        await fastify.prisma.$transaction(async (tx) => {
          const updated = await tx.deposit.updateMany({
            where: { id: deposit.id, status: 'PENDING' },
            data: {
              status: 'REJECTED',
              processedAt: new Date(),
            },
          });
          if (updated.count === 0) return;

          await tx.message.create({
            data: {
              userId: deposit.userId,
              type: 'transaction',
              title: '입금 실패',
              content: `${deposit.amount} ${deposit.coinType} 입금이 실패하였습니다. 사유: ${body.status}`,
              isRead: false,
            },
          });
        });

        fastify.log.info({ depositId: deposit.id }, 'Deposit rejected via webhook');
      }
      // PENDING status - no action needed, wait for next update

      return reply.send({ success: true });
    },
  );

  // ==========================================
  // POST /api/webhooks/withdrawal
  // Called by Heleket/Cryptomus when payout status changes
  // ==========================================
  fastify.post(
    '/api/webhooks/withdrawal',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as WebhookBody;

      if (!body || !body.uuid || !body.sign) {
        return reply.code(400).send({ error: 'Invalid webhook payload' });
      }

      // Verify signature
      const providerName = config.payment.provider;
      let signValid = false;

      if (providerName === 'heleket') {
        signValid = getHeleket().verifyWebhook(body as any, body.sign);
      } else {
        signValid = getCryptomus().verifyPayoutWebhook(body as any, body.sign);
      }

      if (!signValid) {
        fastify.log.warn({ uuid: body.uuid }, 'Withdrawal webhook: invalid signature');
        return reply.code(403).send({ error: 'Invalid signature' });
      }

      fastify.log.info({
        uuid: body.uuid,
        status: body.status,
        txid: body.txid,
      }, 'Withdrawal webhook received');

      // Find withdrawal by provider UUID
      const withdrawal = await fastify.prisma.withdrawal.findUnique({
        where: { providerUuid: body.uuid },
      });

      if (!withdrawal) {
        fastify.log.warn({ uuid: body.uuid }, 'Withdrawal webhook: withdrawal not found');
        return reply.send({ success: true });
      }

      if (withdrawal.status !== 'PENDING') {
        return reply.send({ success: true });
      }

      const newStatus = normalizePayoutStatus(body.status);

      if (newStatus === 'APPROVED') {
        // Payout completed
        await fastify.prisma.$transaction(async (tx) => {
          // Atomic status guard: prevents duplicate processing from concurrent webhooks
          const updated = await tx.withdrawal.updateMany({
            where: { id: withdrawal.id, status: 'PENDING' },
            data: {
              status: 'APPROVED',
              txHash: body.txid || null,
              payoutStatus: body.status,
              processedAt: new Date(),
            },
          });
          if (updated.count === 0) return;

          await tx.message.create({
            data: {
              userId: withdrawal.userId,
              type: 'transaction',
              title: '출금 완료',
              content: `${withdrawal.amount} ${withdrawal.coinType} 출금이 완료되었습니다.${body.txid ? ` TX: ${body.txid}` : ''}`,
              isRead: false,
            },
          });
        });

        fastify.log.info({
          withdrawalId: withdrawal.id,
          userId: withdrawal.userId,
          txid: body.txid,
        }, 'Withdrawal completed via webhook');
      } else if (newStatus === 'REJECTED') {
        // Payout failed - refund user balance
        await fastify.prisma.$transaction(async (tx) => {
          // Atomic status guard: prevents double-refund from concurrent webhooks
          const updated = await tx.withdrawal.updateMany({
            where: { id: withdrawal.id, status: 'PENDING' },
            data: {
              status: 'REJECTED',
              payoutStatus: body.status,
              processedAt: new Date(),
            },
          });
          if (updated.count === 0) return;

          const totalRefund = withdrawal.amount.add(withdrawal.fee);

          const updatedUser = await tx.user.update({
            where: { id: withdrawal.userId },
            data: { balance: { increment: totalRefund } },
            select: { balance: true },
          });

          // Refund money log
          await tx.moneyLog.create({
            data: {
              userId: withdrawal.userId,
              type: 'withdrawal',
              amount: totalRefund,
              balanceAfter: updatedUser.balance,
              description: `${withdrawal.coinType} 출금 실패 환불 (${withdrawal.network})`,
              referenceId: `withdrawal_refund_${withdrawal.id}`,
            },
          });

          await tx.message.create({
            data: {
              userId: withdrawal.userId,
              type: 'transaction',
              title: '출금 실패',
              content: `${withdrawal.amount} ${withdrawal.coinType} 출금이 실패하여 잔액이 복구되었습니다. 사유: ${body.status}`,
              isRead: false,
            },
          });
        });

        fastify.log.info({
          withdrawalId: withdrawal.id,
          userId: withdrawal.userId,
        }, 'Withdrawal rejected, balance refunded via webhook');
      }

      return reply.send({ success: true });
    },
  );
}
