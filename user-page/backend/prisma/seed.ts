import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const main = async () => {
  console.log('Seeding database...');

  // 1. Game Categories
  const categories = [
    { code: 'casino' as const, name: 'Casino', nameKo: '카지노', icon: '🎰', sortOrder: 1 },
    { code: 'slot' as const, name: 'Slot', nameKo: '슬롯', icon: '🎲', sortOrder: 2 },
    { code: 'holdem' as const, name: 'Holdem', nameKo: '홀덤', icon: '🃏', sortOrder: 3 },
    { code: 'sports' as const, name: 'Sports', nameKo: '스포츠', icon: '⚽', sortOrder: 4 },
    { code: 'shooting' as const, name: 'Shooting', nameKo: '슈팅', icon: '🎯', sortOrder: 5 },
    { code: 'coin' as const, name: 'Coin', nameKo: '코인', icon: '🪙', sortOrder: 6 },
    { code: 'mini_game' as const, name: 'Mini Game', nameKo: '미니게임', icon: '🎮', sortOrder: 7 },
  ];

  for (const cat of categories) {
    await prisma.gameCategoryConfig.upsert({
      where: { code: cat.code },
      update: { name: cat.name, nameKo: cat.nameKo, icon: cat.icon, sortOrder: cat.sortOrder },
      create: cat,
    });
  }
  console.log('  Game categories seeded (7)');

  // 2. VIP Levels
  const vipLevels = [
    { level: 1, name: 'Bronze', nameKo: '브론즈', requiredBet: 0, cashbackRate: 0.5 },
    { level: 2, name: 'Silver', nameKo: '실버', requiredBet: 1_000_000, cashbackRate: 1.0 },
    { level: 3, name: 'Gold', nameKo: '골드', requiredBet: 5_000_000, cashbackRate: 1.5 },
    { level: 4, name: 'Platinum', nameKo: '플래티넘', requiredBet: 10_000_000, cashbackRate: 2.0 },
    { level: 5, name: 'Diamond', nameKo: '다이아몬드', requiredBet: 30_000_000, cashbackRate: 2.5 },
    { level: 6, name: 'Master', nameKo: '마스터', requiredBet: 50_000_000, cashbackRate: 3.0 },
    { level: 7, name: 'Grand Master', nameKo: '그랜드마스터', requiredBet: 100_000_000, cashbackRate: 3.5 },
    { level: 8, name: 'Champion', nameKo: '챔피언', requiredBet: 300_000_000, cashbackRate: 4.0 },
    { level: 9, name: 'Hero', nameKo: '히어로', requiredBet: 500_000_000, cashbackRate: 4.5 },
    { level: 10, name: 'Legend', nameKo: '레전드', requiredBet: 1_000_000_000, cashbackRate: 5.0 },
  ];

  for (const vip of vipLevels) {
    await prisma.vipLevel.upsert({
      where: { level: vip.level },
      update: { name: vip.name, nameKo: vip.nameKo, requiredBet: vip.requiredBet, cashbackRate: vip.cashbackRate },
      create: vip,
    });
  }
  console.log('  VIP levels seeded (10)');

  // 3. Attendance Configs (30 days)
  const attendanceConfigs: { day: number; rewardType: 'point' | 'cash'; amount: number; isBonus: boolean }[] = [];

  // Days 1-6: point 1000
  for (let d = 1; d <= 6; d++) attendanceConfigs.push({ day: d, rewardType: 'point', amount: 1000, isBonus: false });
  // Day 7: cash 10000 bonus
  attendanceConfigs.push({ day: 7, rewardType: 'cash', amount: 10000, isBonus: true });
  // Days 8-13: point 1500
  for (let d = 8; d <= 13; d++) attendanceConfigs.push({ day: d, rewardType: 'point', amount: 1500, isBonus: false });
  // Day 14: cash 20000 bonus
  attendanceConfigs.push({ day: 14, rewardType: 'cash', amount: 20000, isBonus: true });
  // Days 15-20: point 2000
  for (let d = 15; d <= 20; d++) attendanceConfigs.push({ day: d, rewardType: 'point', amount: 2000, isBonus: false });
  // Day 21: cash 30000 bonus
  attendanceConfigs.push({ day: 21, rewardType: 'cash', amount: 30000, isBonus: true });
  // Days 22-27: point 2500
  for (let d = 22; d <= 27; d++) attendanceConfigs.push({ day: d, rewardType: 'point', amount: 2500, isBonus: false });
  // Day 28: cash 50000 bonus
  attendanceConfigs.push({ day: 28, rewardType: 'cash', amount: 50000, isBonus: true });
  // Day 29: point 3000
  attendanceConfigs.push({ day: 29, rewardType: 'point', amount: 3000, isBonus: false });
  // Day 30: cash 100000 bonus
  attendanceConfigs.push({ day: 30, rewardType: 'cash', amount: 100000, isBonus: true });

  for (const cfg of attendanceConfigs) {
    await prisma.attendanceConfig.upsert({
      where: { day: cfg.day },
      update: { rewardType: cfg.rewardType, amount: cfg.amount, isBonus: cfg.isBonus },
      create: cfg,
    });
  }
  console.log('  Attendance configs seeded (30)');

  // 4. Missions (10)
  const missions = [
    // Daily (5)
    { name: '로그인', description: '오늘 로그인하기', type: 'daily' as const, rewardType: 'point' as const, rewardAmount: 500, targetValue: 1, sortOrder: 1 },
    { name: '게임 3판', description: '게임 3판 플레이하기', type: 'daily' as const, rewardType: 'point' as const, rewardAmount: 1000, targetValue: 3, sortOrder: 2 },
    { name: '베팅 50만', description: '총 50만원 이상 베팅하기', type: 'daily' as const, rewardType: 'point' as const, rewardAmount: 2000, targetValue: 500000, sortOrder: 3 },
    { name: '충전 1회', description: '입금 1회 이상 하기', type: 'daily' as const, rewardType: 'point' as const, rewardAmount: 1500, targetValue: 1, sortOrder: 4 },
    { name: '출석체크', description: '출석체크 완료하기', type: 'daily' as const, rewardType: 'point' as const, rewardAmount: 500, targetValue: 1, sortOrder: 5 },
    // Weekly (5)
    { name: '게임 30판', description: '이번 주 게임 30판 플레이하기', type: 'weekly' as const, rewardType: 'point' as const, rewardAmount: 5000, targetValue: 30, sortOrder: 6 },
    { name: '베팅 500만', description: '이번 주 총 500만원 이상 베팅하기', type: 'weekly' as const, rewardType: 'point' as const, rewardAmount: 10000, targetValue: 5000000, sortOrder: 7 },
    { name: '연속출석 7일', description: '7일 연속 출석체크 완료하기', type: 'weekly' as const, rewardType: 'point' as const, rewardAmount: 15000, targetValue: 7, sortOrder: 8 },
    { name: '추천 1명', description: '친구 1명 추천하기', type: 'weekly' as const, rewardType: 'cash' as const, rewardAmount: 20000, targetValue: 1, sortOrder: 9 },
    { name: '미션 5개 완료', description: '이번 주 미션 5개 완료하기', type: 'weekly' as const, rewardType: 'point' as const, rewardAmount: 10000, targetValue: 5, sortOrder: 10 },
  ];

  for (const mission of missions) {
    const existing = await prisma.missionConfig.findFirst({
      where: { name: mission.name, type: mission.type },
    });
    if (existing) {
      await prisma.missionConfig.update({
        where: { id: existing.id },
        data: mission,
      });
    } else {
      await prisma.missionConfig.create({ data: mission });
    }
  }
  console.log('  Missions seeded (10)');

  // 5. Spin Configs (8 prizes)
  const spinConfigs = [
    { prizeName: '꽝', rewardType: 'point' as const, amount: 0, weight: 400, sortOrder: 1 },
    { prizeName: '100P', rewardType: 'point' as const, amount: 100, weight: 250, sortOrder: 2 },
    { prizeName: '500P', rewardType: 'point' as const, amount: 500, weight: 150, sortOrder: 3 },
    { prizeName: '1,000P', rewardType: 'point' as const, amount: 1000, weight: 100, sortOrder: 4 },
    { prizeName: '5,000P', rewardType: 'point' as const, amount: 5000, weight: 50, sortOrder: 5 },
    { prizeName: '10,000원', rewardType: 'cash' as const, amount: 10000, weight: 30, sortOrder: 6 },
    { prizeName: '50,000원', rewardType: 'cash' as const, amount: 50000, weight: 15, sortOrder: 7 },
    { prizeName: '500,000원', rewardType: 'cash' as const, amount: 500000, weight: 5, sortOrder: 8 },
  ];

  const existingSpins = await prisma.spinConfig.findMany();
  if (existingSpins.length > 0) {
    await prisma.spinConfig.deleteMany();
  }
  for (const spin of spinConfigs) {
    await prisma.spinConfig.create({ data: spin });
  }
  console.log('  Spin configs seeded (8)');

  // 6. Payback Configs (2)
  const paybackConfigs = [
    { period: 'daily', rate: 5.0, maxAmount: 500000, isActive: true },
    { period: 'weekly', rate: 10.0, maxAmount: 2000000, isActive: true },
  ];

  const existingPaybacks = await prisma.paybackConfig.findMany();
  if (existingPaybacks.length > 0) {
    await prisma.paybackConfig.deleteMany();
  }
  for (const pb of paybackConfigs) {
    await prisma.paybackConfig.create({ data: pb });
  }
  console.log('  Payback configs seeded (2)');

  // 7. Test User
  const passwordHash = await bcrypt.hash('test1234!', 12);

  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {
      nickname: '테스트유저',
      passwordHash,
      phone: '01012345678',
      status: 'ACTIVE',
      balance: 1000000,
      points: 50000,
    },
    create: {
      username: 'testuser',
      nickname: '테스트유저',
      passwordHash,
      phone: '01012345678',
      myReferralCode: 'TESTCODE',
      status: 'ACTIVE',
      balance: 1000000,
      points: 50000,
    },
  });

  // Game Rolling Rates for test user
  const rollingRates = [
    { category: 'casino' as const, rate: 1.5 },
    { category: 'slot' as const, rate: 5.0 },
    { category: 'holdem' as const, rate: 5.0 },
    { category: 'sports' as const, rate: 5.0 },
    { category: 'shooting' as const, rate: 5.0 },
    { category: 'coin' as const, rate: 5.0 },
    { category: 'mini_game' as const, rate: 3.0 },
  ];

  for (const rr of rollingRates) {
    await prisma.gameRollingRate.upsert({
      where: { userId_category: { userId: testUser.id, category: rr.category } },
      update: { rate: rr.rate },
      create: { userId: testUser.id, category: rr.category, rate: rr.rate },
    });
  }
  console.log(`  Test user seeded (id: ${testUser.id}) with 7 rolling rates`);

  // 8. Game Providers (5)
  const providers = [
    { code: 'EVOLUTION', name: 'Evolution', category: 'casino' as const, gameCount: 50, logo: 'https://placehold.co/200x80/0a0a1a/DAA520?text=EVOLUTION&font=montserrat' },
    { code: 'PRAGMATIC', name: 'Pragmatic Play', category: 'slot' as const, gameCount: 80, logo: 'https://placehold.co/200x80/1a0a2e/00BFFF?text=PRAGMATIC&font=montserrat' },
    { code: 'PGSOFT', name: 'PG Soft', category: 'slot' as const, gameCount: 60, logo: 'https://placehold.co/200x80/0a1a0a/7CFC00?text=PG+SOFT&font=montserrat' },
    { code: 'JILI', name: 'JILI', category: 'slot' as const, gameCount: 40, logo: 'https://placehold.co/200x80/2a0a0a/FF4444?text=JILI&font=montserrat' },
    { code: 'SPRIBE', name: 'Spribe', category: 'mini_game' as const, gameCount: 20, logo: 'https://placehold.co/200x80/0a1a2e/00CED1?text=SPRIBE&font=montserrat' },
  ];

  for (const prov of providers) {
    await prisma.gameProvider.upsert({
      where: { code: prov.code },
      update: { name: prov.name, category: prov.category, gameCount: prov.gameCount, logo: prov.logo },
      create: prov,
    });
  }
  console.log('  Game providers seeded (5)');

  // 9. Sample Games (5-8 per provider)
  const randomLaunch = () => Math.floor(Math.random() * 4901) + 100;

  const evolutionProvider = await prisma.gameProvider.findUnique({ where: { code: 'EVOLUTION' } });
  const pragmaticProvider = await prisma.gameProvider.findUnique({ where: { code: 'PRAGMATIC' } });
  const pgsoftProvider = await prisma.gameProvider.findUnique({ where: { code: 'PGSOFT' } });
  const jiliProvider = await prisma.gameProvider.findUnique({ where: { code: 'JILI' } });
  const spribeProvider = await prisma.gameProvider.findUnique({ where: { code: 'SPRIBE' } });

  const gameData: { externalId: string; name: string; providerId: number; category: 'casino' | 'slot' | 'mini_game'; thumbnail: string; sortOrder: number; launchCount: number }[] = [
    // Evolution (casino) - 8 games — gold/black theme
    { externalId: 'EVOLUTION_001', name: '라이브 바카라', providerId: evolutionProvider!.id, category: 'casino', thumbnail: 'https://placehold.co/400x300/1a0a00/DAA520?text=Live%0ABaccarat&font=montserrat', sortOrder: 1, launchCount: randomLaunch() },
    { externalId: 'EVOLUTION_002', name: '드래곤 타이거', providerId: evolutionProvider!.id, category: 'casino', thumbnail: 'https://placehold.co/400x300/2a0a0a/FF6347?text=Dragon%0ATiger&font=montserrat', sortOrder: 2, launchCount: randomLaunch() },
    { externalId: 'EVOLUTION_003', name: '라이브 블랙잭', providerId: evolutionProvider!.id, category: 'casino', thumbnail: 'https://placehold.co/400x300/0a1a0a/2ECC71?text=Live%0ABlackjack&font=montserrat', sortOrder: 3, launchCount: randomLaunch() },
    { externalId: 'EVOLUTION_004', name: '라이브 룰렛', providerId: evolutionProvider!.id, category: 'casino', thumbnail: 'https://placehold.co/400x300/1a0000/DC143C?text=Live%0ARoulette&font=montserrat', sortOrder: 4, launchCount: randomLaunch() },
    { externalId: 'EVOLUTION_005', name: '크레이지 타임', providerId: evolutionProvider!.id, category: 'casino', thumbnail: 'https://placehold.co/400x300/2a1a3a/FF69B4?text=Crazy%0ATime&font=montserrat', sortOrder: 5, launchCount: randomLaunch() },
    { externalId: 'EVOLUTION_006', name: '라이트닝 바카라', providerId: evolutionProvider!.id, category: 'casino', thumbnail: 'https://placehold.co/400x300/0a0a2a/FFD700?text=Lightning%0ABaccarat&font=montserrat', sortOrder: 6, launchCount: randomLaunch() },
    { externalId: 'EVOLUTION_007', name: '스피드 바카라', providerId: evolutionProvider!.id, category: 'casino', thumbnail: 'https://placehold.co/400x300/1a1a00/F0E68C?text=Speed%0ABaccarat&font=montserrat', sortOrder: 7, launchCount: randomLaunch() },
    { externalId: 'EVOLUTION_008', name: '딜 오어 노 딜', providerId: evolutionProvider!.id, category: 'casino', thumbnail: 'https://placehold.co/400x300/2a1a00/FFA500?text=Deal+or%0ANo+Deal&font=montserrat', sortOrder: 8, launchCount: randomLaunch() },

    // Pragmatic Play (slot) - 8 games — purple/blue theme
    { externalId: 'PRAGMATIC_001', name: '게이트 오브 올림푸스', providerId: pragmaticProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/1a0a3a/00BFFF?text=Gates+of%0AOlympus&font=montserrat', sortOrder: 1, launchCount: randomLaunch() },
    { externalId: 'PRAGMATIC_002', name: '스위트 보난자', providerId: pragmaticProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/2a0a2a/FF1493?text=Sweet%0ABonanza&font=montserrat', sortOrder: 2, launchCount: randomLaunch() },
    { externalId: 'PRAGMATIC_003', name: '더 독 하우스', providerId: pragmaticProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/1a1a0a/FFD700?text=The+Dog%0AHouse&font=montserrat', sortOrder: 3, launchCount: randomLaunch() },
    { externalId: 'PRAGMATIC_004', name: '빅 배스 보난자', providerId: pragmaticProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/0a1a2a/1E90FF?text=Big+Bass%0ABonanza&font=montserrat', sortOrder: 4, launchCount: randomLaunch() },
    { externalId: 'PRAGMATIC_005', name: '스타라이트 프린세스', providerId: pragmaticProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/2a0a3a/DA70D6?text=Starlight%0APrincess&font=montserrat', sortOrder: 5, launchCount: randomLaunch() },
    { externalId: 'PRAGMATIC_006', name: '울프 골드', providerId: pragmaticProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/1a1a00/B8860B?text=Wolf%0AGold&font=montserrat', sortOrder: 6, launchCount: randomLaunch() },
    { externalId: 'PRAGMATIC_007', name: '북 오브 데드', providerId: pragmaticProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/2a1a0a/CD853F?text=Book+of%0ADead&font=montserrat', sortOrder: 7, launchCount: randomLaunch() },
    { externalId: 'PRAGMATIC_008', name: '슈가 러쉬', providerId: pragmaticProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/2a0a1a/FF6B81?text=Sugar%0ARush&font=montserrat', sortOrder: 8, launchCount: randomLaunch() },

    // PG Soft (slot) - 7 games — green/teal theme
    { externalId: 'PGSOFT_001', name: '마작 웨이즈', providerId: pgsoftProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/0a1a1a/20B2AA?text=Mahjong%0AWays&font=montserrat', sortOrder: 1, launchCount: randomLaunch() },
    { externalId: 'PGSOFT_002', name: '포춘 타이거', providerId: pgsoftProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/2a1a00/FF8C00?text=Fortune%0ATiger&font=montserrat', sortOrder: 2, launchCount: randomLaunch() },
    { externalId: 'PGSOFT_003', name: '럭키 네코', providerId: pgsoftProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/2a0a1a/FF69B4?text=Lucky%0ANeko&font=montserrat', sortOrder: 3, launchCount: randomLaunch() },
    { externalId: 'PGSOFT_004', name: '보물 대장정', providerId: pgsoftProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/1a1a0a/DAA520?text=Treasure%0AHunt&font=montserrat', sortOrder: 4, launchCount: randomLaunch() },
    { externalId: 'PGSOFT_005', name: '드래곤 해치', providerId: pgsoftProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/1a0a0a/FF4500?text=Dragon%0AHatch&font=montserrat', sortOrder: 5, launchCount: randomLaunch() },
    { externalId: 'PGSOFT_006', name: '캡틴스 바운티', providerId: pgsoftProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/0a0a2a/4169E1?text=Captains%0ABounty&font=montserrat', sortOrder: 6, launchCount: randomLaunch() },
    { externalId: 'PGSOFT_007', name: '포춘 옥스', providerId: pgsoftProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/2a0a00/FF6347?text=Fortune%0AOx&font=montserrat', sortOrder: 7, launchCount: randomLaunch() },

    // JILI (slot) - 6 games — red/warm theme
    { externalId: 'JILI_001', name: '슈퍼 에이스', providerId: jiliProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/1a0a2a/9370DB?text=Super%0AAce&font=montserrat', sortOrder: 1, launchCount: randomLaunch() },
    { externalId: 'JILI_002', name: '골든 엠파이어', providerId: jiliProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/1a1a00/FFD700?text=Golden%0AEmpire&font=montserrat', sortOrder: 2, launchCount: randomLaunch() },
    { externalId: 'JILI_003', name: '마니 커밍', providerId: jiliProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/0a2a0a/32CD32?text=Money%0AComing&font=montserrat', sortOrder: 3, launchCount: randomLaunch() },
    { externalId: 'JILI_004', name: '박싱 킹', providerId: jiliProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/2a0a0a/FF0000?text=Boxing%0AKing&font=montserrat', sortOrder: 4, launchCount: randomLaunch() },
    { externalId: 'JILI_005', name: '크레이지 777', providerId: jiliProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/2a1a3a/EE82EE?text=Crazy%0A777&font=montserrat', sortOrder: 5, launchCount: randomLaunch() },
    { externalId: 'JILI_006', name: '포춘 젬스', providerId: jiliProvider!.id, category: 'slot', thumbnail: 'https://placehold.co/400x300/0a2a2a/00CED1?text=Fortune%0AGems&font=montserrat', sortOrder: 6, launchCount: randomLaunch() },

    // Spribe (mini_game) - 5 games — cyan/neon theme
    { externalId: 'SPRIBE_001', name: '에비에이터', providerId: spribeProvider!.id, category: 'mini_game', thumbnail: 'https://placehold.co/400x300/1a0000/FF2400?text=Aviator%0A%E2%9C%88&font=montserrat', sortOrder: 1, launchCount: randomLaunch() },
    { externalId: 'SPRIBE_002', name: '마인즈', providerId: spribeProvider!.id, category: 'mini_game', thumbnail: 'https://placehold.co/400x300/0a0a1a/1E90FF?text=Mines%0A%F0%9F%92%8E&font=montserrat', sortOrder: 2, launchCount: randomLaunch() },
    { externalId: 'SPRIBE_003', name: '다이스', providerId: spribeProvider!.id, category: 'mini_game', thumbnail: 'https://placehold.co/400x300/0a1a0a/00FF7F?text=Dice%0A%F0%9F%8E%B2&font=montserrat', sortOrder: 3, launchCount: randomLaunch() },
    { externalId: 'SPRIBE_004', name: '골', providerId: spribeProvider!.id, category: 'mini_game', thumbnail: 'https://placehold.co/400x300/0a1a1a/00BFFF?text=Goal%0A%E2%9A%BD&font=montserrat', sortOrder: 4, launchCount: randomLaunch() },
    { externalId: 'SPRIBE_005', name: '하이로', providerId: spribeProvider!.id, category: 'mini_game', thumbnail: 'https://placehold.co/400x300/1a1a0a/FFD700?text=Hi-Lo%0A%F0%9F%83%8F&font=montserrat', sortOrder: 5, launchCount: randomLaunch() },
  ];

  for (const game of gameData) {
    await prisma.game.upsert({
      where: { externalId: game.externalId },
      update: { name: game.name, thumbnail: game.thumbnail, sortOrder: game.sortOrder, launchCount: game.launchCount },
      create: game,
    });
  }
  console.log(`  Games seeded (${gameData.length})`);

  console.log('Seed completed successfully!');
};

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
