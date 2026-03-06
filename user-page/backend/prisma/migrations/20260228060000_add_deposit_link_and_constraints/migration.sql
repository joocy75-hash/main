-- AlterTable: Add deposit_id to user_promotions
ALTER TABLE "user_promotions" ADD COLUMN "deposit_id" INTEGER;

-- AddForeignKey
ALTER TABLE "user_promotions" ADD CONSTRAINT "user_promotions_deposit_id_fkey" FOREIGN KEY ("deposit_id") REFERENCES "deposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: Prevent same deposit used for multiple promotions
CREATE UNIQUE INDEX "user_promotions_user_id_deposit_id_key" ON "user_promotions"("user_id", "deposit_id");

-- CreateIndex: Idempotency constraint on money_logs
CREATE UNIQUE INDEX "money_logs_reference_id_user_id_type_key" ON "money_logs"("reference_id", "user_id", "type");

-- CreateIndex: Idempotency constraint on point_logs
CREATE UNIQUE INDEX "point_logs_reference_id_user_id_type_key" ON "point_logs"("reference_id", "user_id", "type");

-- CreateIndex: Performance index on spin_logs
CREATE INDEX "spin_logs_user_id_spin_date_idx" ON "spin_logs"("user_id", "spin_date");
