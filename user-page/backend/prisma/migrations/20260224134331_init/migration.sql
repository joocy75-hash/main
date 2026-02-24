-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('ROLLING', 'LOSING');

-- CreateEnum
CREATE TYPE "CoinType" AS ENUM ('USDT', 'TRX', 'ETH', 'BTC', 'BNB');

-- CreateEnum
CREATE TYPE "NetworkType" AS ENUM ('TRC20', 'ERC20', 'BEP20', 'BTC');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "GameCategory" AS ENUM ('casino', 'slot', 'holdem', 'sports', 'shooting', 'coin', 'mini_game');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('point', 'cash', 'bonus');

-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('daily', 'weekly');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('active', 'completed', 'claimed');

-- CreateEnum
CREATE TYPE "MoneyLogType" AS ENUM ('deposit', 'withdrawal', 'bet', 'win', 'bonus', 'admin_adjustment', 'promotion', 'commission', 'promotion_revoke', 'commission_reversal', 'payback', 'point_conversion');

-- CreateEnum
CREATE TYPE "PointLogType" AS ENUM ('admin_adjustment', 'attendance', 'mission', 'spin', 'rolling', 'losing', 'conversion', 'event');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('system', 'admin', 'reward', 'transaction', 'referral');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('pending', 'answered', 'closed');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(20) NOT NULL,
    "nickname" VARCHAR(20) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" VARCHAR(15),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "points" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "bonus_balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "referrer_code" VARCHAR(20),
    "my_referral_code" VARCHAR(20) NOT NULL,
    "vip_level" INTEGER NOT NULL DEFAULT 1,
    "commission_type" "CommissionType" NOT NULL DEFAULT 'ROLLING',
    "losing_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "commission_enabled" BOOLEAN NOT NULL DEFAULT true,
    "deposit_address" TEXT,
    "deposit_network" VARCHAR(10),
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "referrer_id" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ip" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "device" VARCHAR(50),
    "os" VARCHAR(50),
    "browser" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_addresses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "coin_type" "CoinType" NOT NULL,
    "network" "NetworkType" NOT NULL,
    "address" VARCHAR(100) NOT NULL,
    "label" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "coin_type" "CoinType" NOT NULL,
    "network" "NetworkType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "deposit_address" TEXT,
    "tx_hash" VARCHAR(100),
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "coin_type" "CoinType" NOT NULL,
    "network" "NetworkType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "fee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "address" VARCHAR(100) NOT NULL,
    "tx_hash" VARCHAR(100),
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_categories" (
    "id" SERIAL NOT NULL,
    "code" "GameCategory" NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "name_ko" VARCHAR(50) NOT NULL,
    "icon" VARCHAR(10),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "game_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_providers" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "logo" TEXT,
    "category" "GameCategory" NOT NULL,
    "game_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "external_id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "provider_id" INTEGER NOT NULL,
    "category" "GameCategory" NOT NULL,
    "thumbnail" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "launch_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bet_records" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "category" "GameCategory" NOT NULL,
    "bet_amount" DECIMAL(18,2) NOT NULL,
    "win_amount" DECIMAL(18,2) NOT NULL,
    "outcome" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bet_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_rolling_rates" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category" "GameCategory" NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "game_rolling_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "money_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "MoneyLogType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balance_after" DECIMAL(18,2) NOT NULL,
    "description" VARCHAR(200),
    "reference_id" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "money_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "PointLogType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "points_after" DECIMAL(18,2) NOT NULL,
    "description" VARCHAR(200),
    "reference_id" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_records" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "from_user_id" INTEGER NOT NULL,
    "type" "CommissionType" NOT NULL,
    "category" "GameCategory" NOT NULL,
    "base_amount" DECIMAL(18,2) NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "reference_id" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_configs" (
    "id" SERIAL NOT NULL,
    "day" INTEGER NOT NULL,
    "reward_type" "RewardType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "is_bonus" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "attendance_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "check_in_date" DATE NOT NULL,
    "day_number" INTEGER NOT NULL,
    "reward_amount" DECIMAL(18,2) NOT NULL,
    "reward_type" "RewardType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "type" "MissionType" NOT NULL,
    "reward_type" "RewardType" NOT NULL,
    "reward_amount" DECIMAL(18,2) NOT NULL,
    "target_value" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_progress" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mission_id" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "MissionStatus" NOT NULL DEFAULT 'active',
    "completed_at" TIMESTAMP(3),
    "claimed_at" TIMESTAMP(3),
    "reset_date" DATE NOT NULL,

    CONSTRAINT "mission_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_configs" (
    "id" SERIAL NOT NULL,
    "prize_name" VARCHAR(100) NOT NULL,
    "reward_type" "RewardType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "spin_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "spin_date" DATE NOT NULL,
    "prize_name" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reward_type" "RewardType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payback_configs" (
    "id" SERIAL NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "max_amount" DECIMAL(18,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "payback_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "banner_url" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "bonus_rate" DECIMAL(5,2),
    "max_bonus" DECIMAL(18,2),
    "min_deposit" DECIMAL(18,2),
    "wagering" INTEGER,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_promotions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "promotion_id" INTEGER NOT NULL,
    "bonus_amount" DECIMAL(18,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'system',
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_replies" (
    "id" SERIAL NOT NULL,
    "inquiry_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vip_levels" (
    "id" SERIAL NOT NULL,
    "level" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "name_ko" VARCHAR(50) NOT NULL,
    "required_bet" DECIMAL(18,2) NOT NULL,
    "cashback_rate" DECIMAL(5,2) NOT NULL,
    "benefits" TEXT,

    CONSTRAINT "vip_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_my_referral_code_key" ON "users"("my_referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "game_categories_code_key" ON "game_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "game_providers_code_key" ON "game_providers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "games_external_id_key" ON "games"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_rolling_rates_user_id_category_key" ON "game_rolling_rates"("user_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "commission_records_reference_id_user_id_type_key" ON "commission_records"("reference_id", "user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_configs_day_key" ON "attendance_configs"("day");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_logs_user_id_check_in_date_key" ON "attendance_logs"("user_id", "check_in_date");

-- CreateIndex
CREATE UNIQUE INDEX "mission_progress_user_id_mission_id_reset_date_key" ON "mission_progress"("user_id", "mission_id", "reset_date");

-- CreateIndex
CREATE UNIQUE INDEX "vip_levels_level_key" ON "vip_levels"("level");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_addresses" ADD CONSTRAINT "wallet_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "game_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_records" ADD CONSTRAINT "bet_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_records" ADD CONSTRAINT "bet_records_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_rolling_rates" ADD CONSTRAINT "game_rolling_rates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "money_logs" ADD CONSTRAINT "money_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_logs" ADD CONSTRAINT "point_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_progress" ADD CONSTRAINT "mission_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_progress" ADD CONSTRAINT "mission_progress_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spin_logs" ADD CONSTRAINT "spin_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promotions" ADD CONSTRAINT "user_promotions_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_replies" ADD CONSTRAINT "inquiry_replies_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
