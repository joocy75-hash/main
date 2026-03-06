-- AlterTable
ALTER TABLE "deposits" ADD COLUMN     "confirmations" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expired_at" TIMESTAMP(3),
ADD COLUMN     "from_address" VARCHAR(200),
ADD COLUMN     "merchant_amount" DECIMAL(18,8),
ADD COLUMN     "payer_currency" VARCHAR(10),
ADD COLUMN     "payment_amount" DECIMAL(18,8),
ADD COLUMN     "payment_url" TEXT,
ADD COLUMN     "provider_name" VARCHAR(20),
ADD COLUMN     "provider_uuid" VARCHAR(100),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,8),
ALTER COLUMN "tx_hash" SET DATA TYPE VARCHAR(200);

-- AlterTable
ALTER TABLE "withdrawals" ADD COLUMN     "payout_status" VARCHAR(30),
ADD COLUMN     "provider_name" VARCHAR(20),
ADD COLUMN     "provider_uuid" VARCHAR(100),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,8),
ALTER COLUMN "fee" SET DATA TYPE DECIMAL(18,8),
ALTER COLUMN "address" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "tx_hash" SET DATA TYPE VARCHAR(200);

-- CreateIndex
CREATE UNIQUE INDEX "deposits_provider_uuid_key" ON "deposits"("provider_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "user_promotions_user_id_promotion_id_key" ON "user_promotions"("user_id", "promotion_id");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_provider_uuid_key" ON "withdrawals"("provider_uuid");

-- AddForeignKey
ALTER TABLE "user_promotions" ADD CONSTRAINT "user_promotions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

