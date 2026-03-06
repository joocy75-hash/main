// Sports service: fetches real data from PandaScore (esports) and API-Football (football).
// Falls back to mock data when APIs are unavailable.

import { config } from '../config.js';

interface SportCategory {
  code: string;
  name: string;
  nameKo: string;
  icon: string;
  eventCount: number;
}

interface Team {
  name: string;
  nameKo: string;
  logo?: string;
  score?: number;
}

interface SportEvent {
  id: number;
  sport: string;
  sportKo: string;
  league: string;
  leagueKo: string;
  leagueLogo?: string;
  countryFlag?: string;
  countryName?: string;
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED';
  homeTeam: Team;
  awayTeam: Team;
  startTime: string;
  elapsed?: string;
  period?: string;
  odds?: { h: string; d: string; a: string };
}

interface BookmakerOdds {
  bookmaker: string;
  bookmakerKo: string;
  markets: {
    type: string;
    outcomes: { name: string; odds: number }[];
  }[];
  updatedAt: string;
}

interface EventOdds {
  eventId: number;
  bookmakers: BookmakerOdds[];
}

interface EsportsCategory {
  code: string;
  name: string;
  nameKo: string;
  icon: string;
}

// ─── Cache ───────────────────────────────────────────
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── Constants ───────────────────────────────────────
const SPORT_CATEGORIES: SportCategory[] = [
  { code: 'football', name: 'Football', nameKo: '축구', icon: '⚽', eventCount: 0 },
  { code: 'basketball', name: 'Basketball', nameKo: '농구', icon: '🏀', eventCount: 0 },
  { code: 'baseball', name: 'Baseball', nameKo: '야구', icon: '⚾', eventCount: 0 },
  { code: 'tennis', name: 'Tennis', nameKo: '테니스', icon: '🎾', eventCount: 0 },
  { code: 'volleyball', name: 'Volleyball', nameKo: '배구', icon: '🏐', eventCount: 0 },
  { code: 'ice_hockey', name: 'Ice Hockey', nameKo: '아이스하키', icon: '🏒', eventCount: 0 },
  { code: 'mma', name: 'MMA', nameKo: '격투기', icon: '🥊', eventCount: 0 },
  { code: 'table_tennis', name: 'Table Tennis', nameKo: '탁구', icon: '🏓', eventCount: 0 },
];

const ESPORTS_CATEGORIES: EsportsCategory[] = [
  { code: 'lol', name: 'League of Legends', nameKo: 'LoL', icon: '⚔️' },
  { code: 'cs2', name: 'Counter-Strike', nameKo: 'CS2', icon: '🔫' },
  { code: 'valorant', name: 'Valorant', nameKo: '발로란트', icon: '🎯' },
  { code: 'dota2', name: 'Dota 2', nameKo: '도타2', icon: '🛡️' },
  { code: 'overwatch', name: 'Overwatch', nameKo: '오버워치', icon: '🎮' },
  { code: 'pubg', name: 'PUBG', nameKo: 'PUBG', icon: '🔫' },
  { code: 'starcraft', name: 'StarCraft', nameKo: '스타크래프트', icon: '🌌' },
  { code: 'r6siege', name: 'Rainbow Six Siege', nameKo: 'R6 시즈', icon: '🛡️' },
];

const PANDASCORE_GAME_NAME_KO: Record<string, string> = {
  'League of Legends': 'LoL',
  'Counter-Strike': 'CS2',
  'CS:GO': 'CS2',
  'Dota 2': '도타2',
  'Valorant': '발로란트',
  'Overwatch': '오버워치',
  'PUBG': 'PUBG',
  'Rainbow Six Siege': 'R6 시즈',
  'Rocket League': '로켓 리그',
  'StarCraft 2': '스타2',
  'StarCraft Brood War': '스타1',
  'LoL Wild Rift': '와일드 리프트',
  'Call of Duty': 'CoD',
  'EA Sports FC': 'EA FC',
  'King of Glory': '왕자영요',
  'Mobile Legends: Bang Bang': 'MLBB',
};

const FOOTBALL_STATUS_MAP: Record<string, { period: string; isLive: boolean }> = {
  '1H': { period: '전반전', isLive: true },
  '2H': { period: '후반전', isLive: true },
  'HT': { period: '하프타임', isLive: true },
  'ET': { period: '연장전', isLive: true },
  'BT': { period: '연장 하프타임', isLive: true },
  'P': { period: '승부차기', isLive: true },
  'SUSP': { period: '중단', isLive: true },
  'INT': { period: '중단', isLive: true },
  'LIVE': { period: '진행중', isLive: true },
  'FT': { period: '경기 종료', isLive: false },
  'AET': { period: '연장 종료', isLive: false },
  'PEN': { period: '승부차기 종료', isLive: false },
  'NS': { period: '', isLive: false },
  'TBD': { period: '', isLive: false },
  'PST': { period: '연기', isLive: false },
  'CANC': { period: '취소', isLive: false },
  'ABD': { period: '중단', isLive: false },
  'WO': { period: '부전승', isLive: false },
};

const LEAGUE_NAME_KO: Record<string, string> = {
  'Premier League': '프리미어리그',
  'La Liga': '라리가',
  'Bundesliga': '분데스리가',
  'Serie A': '세리에A',
  'Ligue 1': '리그앙',
  'Champions League': '챔피언스리그',
  'Europa League': '유로파리그',
  'Europa Conference League': '컨퍼런스리그',
  'K League 1': 'K리그1',
  'K League 2': 'K리그2',
  'J1 League': 'J리그',
  'J2 League': 'J2리그',
  'Chinese Super League': '중국 슈퍼리그',
  'MLS': 'MLS',
  'Eredivisie': '에레디비시',
  'Primeira Liga': '프리메이라리가',
  'Super Lig': '쉬페르리그',
  'Saudi Pro League': '사우디 프로리그',
  'World Cup': '월드컵',
  'Euro Championship': '유로',
  'AFC Champions League': 'AFC 챔피언스리그',
  'Copa Libertadores': '코파 리베르타도레스',
  'Copa Sudamericana': '코파 수다메리카나',
  'Copa do Brasil': '코파 두 브라질',
  'FIFA Club World Cup': 'FIFA 클럽 월드컵',
  'FA Cup': 'FA컵',
  'EFL Cup': 'EFL컵',
  'Copa del Rey': '코파 델 레이',
  'DFB Pokal': 'DFB 포칼',
  'Coppa Italia': '코파 이탈리아',
  'Coupe de France': '쿠프 드 프랑스',
  'A-League': 'A리그',
  'Scottish Premiership': '스코틀랜드 프리미어십',
  'Belgian Pro League': '벨기에 프로리그',
  'Swiss Super League': '스위스 슈퍼리그',
  'Austrian Bundesliga': '오스트리아 분데스리가',
  'Danish Superliga': '덴마크 수페르리가',
  'Swedish Allsvenskan': '스웨덴 알스벤스칸',
  'Norwegian Eliteserien': '노르웨이 엘리테세리엔',
  'Russian Premier League': '러시아 프리미어리그',
  'Ukrainian Premier League': '우크라이나 프리미어리그',
  'Brazilian Serie A': '브라질 세리에A',
  'Argentine Primera Division': '아르헨티나 프리메라',
  'Liga MX': '리가 MX',
  'World Cup Qualifiers': '월드컵 예선',
  'African Cup of Nations': '아프리카 네이션스컵',
  'Asian Cup': '아시안컵',
  'Nations League': '네이션스 리그',
  'Friendly International': '친선 경기',
  'Olympic Games': '올림픽',
  'NBA': 'NBA',
  'NHL': 'NHL',
  'MLB': 'MLB',
  'NFL': 'NFL',
  'KBO League': 'KBO 리그',
  'NPB': 'NPB',
  'WKBL': 'WKBL',
  'KBL': 'KBL',
  'V-League': 'V리그',
  'ATP': 'ATP',
  'WTA': 'WTA',
};

const COUNTRY_NAME_KO: Record<string, string> = {
  'England': '잉글랜드', 'Spain': '스페인', 'Germany': '독일',
  'Italy': '이탈리아', 'France': '프랑스', 'Netherlands': '네덜란드',
  'Portugal': '포르투갈', 'Turkey': '터키', 'Belgium': '벨기에',
  'Scotland': '스코틀랜드', 'Austria': '오스트리아', 'Switzerland': '스위스',
  'Denmark': '덴마크', 'Sweden': '스웨덴', 'Norway': '노르웨이',
  'Russia': '러시아', 'Ukraine': '우크라이나', 'Poland': '폴란드',
  'Greece': '그리스', 'Czech Republic': '체코', 'Croatia': '크로아티아',
  'Serbia': '세르비아', 'Romania': '루마니아', 'Hungary': '헝가리',
  'Brazil': '브라질', 'Argentina': '아르헨티나', 'Colombia': '콜롬비아',
  'Mexico': '멕시코', 'Chile': '칠레', 'Peru': '페루', 'Ecuador': '에콰도르',
  'Uruguay': '우루과이', 'Paraguay': '파라과이', 'Venezuela': '베네수엘라',
  'Guatemala': '과테말라', 'Costa Rica': '코스타리카', 'Honduras': '온두라스',
  'USA': '미국', 'Canada': '캐나다', 'Japan': '일본',
  'South Korea': '한국', 'Korea Republic': '한국',
  'China': '중국', 'Australia': '호주', 'India': '인도',
  'Saudi Arabia': '사우디아라비아', 'Qatar': '카타르', 'UAE': 'UAE',
  'Iran': '이란', 'Thailand': '태국', 'Vietnam': '베트남',
  'Indonesia': '인도네시아', 'Malaysia': '말레이시아',
  'Egypt': '이집트', 'South Africa': '남아공', 'Nigeria': '나이지리아',
  'Morocco': '모로코', 'Algeria': '알제리', 'Tunisia': '튀니지',
  'Ghana': '가나', 'Cameroon': '카메룬', 'Senegal': '세네갈',
  'World': '국제', 'Europe': '유럽', 'Asia': '아시아',
  'Africa': '아프리카', 'South America': '남미', 'North America': '북미',
};

const TEAM_NAME_KO: Record<string, string> = {
  // 프리미어리그
  'Manchester United': '맨유', 'Manchester City': '맨시티',
  'Liverpool': '리버풀', 'Arsenal': '아스날', 'Chelsea': '첼시',
  'Tottenham Hotspur': '토트넘', 'Newcastle United': '뉴캐슬',
  'Aston Villa': '아스톤빌라', 'Brighton': '브라이턴',
  'West Ham United': '웨스트햄', 'Everton': '에버턴',
  'Nottingham Forest': '노팅엄', 'Fulham': '풀럼',
  'Crystal Palace': '크리스탈 팰리스', 'Wolverhampton Wanderers': '울버햄튼',
  'Brentford': '브렌트포드', 'Bournemouth': '본머스',
  'Leicester City': '레스터', 'Ipswich Town': '입스위치',
  'Southampton': '사우샘프턴',
  // 라리가
  'Real Madrid': '레알 마드리드', 'FC Barcelona': '바르셀로나',
  'Atletico Madrid': '아틀레티코', 'Sevilla FC': '세비야',
  'Real Sociedad': '레알 소시에다드', 'Real Betis': '레알 베티스',
  'Valencia CF': '발렌시아', 'Athletic Club': '아틀레틱 빌바오',
  'Villarreal CF': '비야레알', 'Celta Vigo': '셀타 비고',
  'Girona FC': '지로나', 'RCD Mallorca': '마요르카',
  // 분데스리가
  'Bayern Munich': '바이에른 뮌헨', 'Borussia Dortmund': '도르트문트',
  'RB Leipzig': 'RB 라이프치히', 'Bayer Leverkusen': '레버쿠젠',
  'VfB Stuttgart': '슈투트가르트', 'Eintracht Frankfurt': '프랑크푸르트',
  'VfL Wolfsburg': '볼프스부르크', 'Borussia Monchengladbach': '묀헨글라트바흐',
  'SC Freiburg': '프라이부르크', 'FC Union Berlin': '우니온 베를린',
  // 세리에A
  'Inter Milan': '인테르', 'AC Milan': 'AC밀란', 'Juventus': '유벤투스',
  'SSC Napoli': '나폴리', 'AS Roma': 'AS로마', 'SS Lazio': '라치오',
  'Atalanta BC': '아탈란타', 'ACF Fiorentina': '피오렌티나',
  'Bologna FC 1909': '볼로냐', 'Torino FC': '토리노',
  // 리그앙
  'Paris Saint-Germain': '파리 생제르맹', 'PSG': '파리 생제르맹',
  'Olympique de Marseille': '마르세유', 'AS Monaco': '모나코',
  'Olympique Lyonnais': '리옹', 'LOSC Lille': '릴',
  'OGC Nice': '니스', 'RC Lens': '랑스',
  'Stade Rennais FC': '렌', 'RC Strasbourg': '스트라스부르',
  // 한국 (K리그)
  'Ulsan HD': '울산 HD', 'Jeonbuk Hyundai Motors': '전북 현대',
  'FC Seoul': 'FC 서울', 'Pohang Steelers': '포항 스틸러스',
  'Suwon Samsung Bluewings': '수원 삼성', 'Incheon United': '인천 유나이티드',
  'Daegu FC': '대구 FC', 'Gwangju FC': '광주 FC',
  'Gangwon FC': '강원 FC', 'Jeju United': '제주 유나이티드',
  // 일본 (J리그)
  'Vissel Kobe': '비셀 고베', 'Yokohama F. Marinos': '요코하마 마리노스',
  'Kawasaki Frontale': '가와사키', 'Urawa Red Diamonds': '우라와 레즈',
  // NBA
  'Los Angeles Lakers': 'LA 레이커스', 'Golden State Warriors': 'GS 워리어스',
  'Boston Celtics': '보스턴 셀틱스', 'Milwaukee Bucks': '밀워키 벅스',
  'Denver Nuggets': '덴버 너기츠', 'Phoenix Suns': '피닉스 선즈',
  'Philadelphia 76ers': '필라델피아 76ers', 'Miami Heat': '마이애미 히트',
  'Dallas Mavericks': '댈러스 매버릭스', 'Cleveland Cavaliers': '클리블랜드 캐벌리어스',
  'New York Knicks': '뉴욕 닉스', 'Sacramento Kings': '새크라멘토 킹스',
  'Oklahoma City Thunder': 'OKC 썬더', 'Minnesota Timberwolves': '미네소타 울브스',
  'Indiana Pacers': '인디애나 페이서스', 'Orlando Magic': '올랜도 매직',
  'Houston Rockets': '휴스턴 로케츠', 'Memphis Grizzlies': '멤피스 그리즐리스',
  'Brooklyn Nets': '브루클린 네츠', 'Chicago Bulls': '시카고 불스',
  'Washington Wizards': '워싱턴 위저즈', 'Utah Jazz': '유타 재즈',
  'Atlanta Hawks': '애틀랜타 호크스', 'Toronto Raptors': '토론토 랩터스',
  'LA Clippers': 'LA 클리퍼스', 'San Antonio Spurs': '샌안토니오 스퍼스',
  'Portland Trail Blazers': '포틀랜드 블레이저스', 'Charlotte Hornets': '샬럿 호네츠',
  'Detroit Pistons': '디트로이트 피스톤즈', 'New Orleans Pelicans': '뉴올리언스 펠리컨스',
  // NHL
  'Florida Panthers': '플로리다 팬서스', 'Columbus Blue Jackets': '콜럼버스 블루 재킷츠',
  'Edmonton Oilers': '에드먼턴 오일러스', 'Dallas Stars': '댈러스 스타스',
  'New York Rangers': '뉴욕 레인저스', 'Carolina Hurricanes': '캐롤라이나 허리케인즈',
  'Vegas Golden Knights': '베이거스 골든나이츠', 'Colorado Avalanche': '콜로라도 애벌런치',
  'Winnipeg Jets': '위니펙 제츠', 'Tampa Bay Lightning': '탬파베이 라이트닝',
  'Toronto Maple Leafs': '토론토 메이플 리프스', 'Boston Bruins': '보스턴 브루인스',
};

// ─── Mock Data (fallback) ────────────────────────────
const MOCK_LIVE_EVENTS: SportEvent[] = [
  {
    id: 1001, sport: 'football', sportKo: '축구',
    league: 'Premier League', leagueKo: '프리미어리그', status: 'LIVE',
    countryName: '잉글랜드', countryFlag: 'https://media.api-sports.io/flags/gb.svg',
    leagueLogo: 'https://media.api-sports.io/football/leagues/39.png',
    homeTeam: { name: 'Manchester United', nameKo: '맨유', score: 2, logo: 'https://media.api-sports.io/football/teams/33.png' },
    awayTeam: { name: 'Liverpool', nameKo: '리버풀', score: 1, logo: 'https://media.api-sports.io/football/teams/40.png' },
    startTime: new Date(Date.now() - 67 * 60000).toISOString(),
    elapsed: "67'", period: '후반전',
    odds: { h: '2.23', d: '2.86', a: '3.30' },
  },
  {
    id: 1002, sport: 'football', sportKo: '축구',
    league: 'La Liga', leagueKo: '라리가', status: 'LIVE',
    countryName: '스페인', countryFlag: 'https://media.api-sports.io/flags/es.svg',
    leagueLogo: 'https://media.api-sports.io/football/leagues/140.png',
    homeTeam: { name: 'Real Madrid', nameKo: '레알 마드리드', score: 0, logo: 'https://media.api-sports.io/football/teams/541.png' },
    awayTeam: { name: 'FC Barcelona', nameKo: '바르셀로나', score: 0, logo: 'https://media.api-sports.io/football/teams/529.png' },
    startTime: new Date(Date.now() - 23 * 60000).toISOString(),
    elapsed: "23'", period: '전반전',
    odds: { h: '1.55', d: '3.80', a: '5.20' },
  },
  {
    id: 1003, sport: 'basketball', sportKo: '농구',
    league: 'NBA', leagueKo: 'NBA', status: 'LIVE',
    countryName: '미국',
    homeTeam: { name: 'Los Angeles Lakers', nameKo: 'LA 레이커스', score: 87 },
    awayTeam: { name: 'Golden State Warriors', nameKo: 'GS 워리어스', score: 92 },
    startTime: new Date(Date.now() - 120 * 60000).toISOString(),
    elapsed: '3Q 8:45', period: '3쿼터',
    odds: { h: '1.65', d: 'VS', a: '2.15' },
  },
  {
    id: 1004, sport: 'ice_hockey', sportKo: '아이스하키',
    league: 'NHL', leagueKo: 'NHL', status: 'LIVE',
    countryName: '미국',
    homeTeam: { name: 'Edmonton Oilers', nameKo: '에드먼턴 오일러스', score: 3 },
    awayTeam: { name: 'Florida Panthers', nameKo: '플로리다 팬서스', score: 2 },
    startTime: new Date(Date.now() - 100 * 60000).toISOString(),
    elapsed: '2P 14:22', period: '2피리어드',
    odds: { h: '1.80', d: 'VS', a: '1.95' },
  },
];

const MOCK_SCHEDULED_EVENTS: SportEvent[] = [
  {
    id: 2001, sport: 'football', sportKo: '축구',
    league: 'Champions League', leagueKo: '챔피언스리그', status: 'SCHEDULED',
    countryName: '유럽',
    leagueLogo: 'https://media.api-sports.io/football/leagues/2.png',
    homeTeam: { name: 'Bayern Munich', nameKo: '바이에른 뮌헨', logo: 'https://media.api-sports.io/football/teams/157.png' },
    awayTeam: { name: 'PSG', nameKo: '파리 생제르맹', logo: 'https://media.api-sports.io/football/teams/85.png' },
    startTime: new Date(Date.now() + 3 * 3600000).toISOString(),
    odds: { h: '2.10', d: '3.10', a: '3.50' },
  },
  {
    id: 2002, sport: 'football', sportKo: '축구',
    league: 'Serie A', leagueKo: '세리에A', status: 'SCHEDULED',
    countryName: '이탈리아', countryFlag: 'https://media.api-sports.io/flags/it.svg',
    leagueLogo: 'https://media.api-sports.io/football/leagues/135.png',
    homeTeam: { name: 'Inter Milan', nameKo: '인테르', logo: 'https://media.api-sports.io/football/teams/505.png' },
    awayTeam: { name: 'AC Milan', nameKo: 'AC밀란', logo: 'https://media.api-sports.io/football/teams/489.png' },
    startTime: new Date(Date.now() + 5 * 3600000).toISOString(),
    odds: { h: '1.75', d: '3.40', a: '4.80' },
  },
  {
    id: 2003, sport: 'football', sportKo: '축구',
    league: 'K League 1', leagueKo: 'K리그1', status: 'SCHEDULED',
    countryName: '한국', countryFlag: 'https://media.api-sports.io/flags/kr.svg',
    homeTeam: { name: 'Ulsan HD', nameKo: '울산 HD' },
    awayTeam: { name: 'FC Seoul', nameKo: 'FC 서울' },
    startTime: new Date(Date.now() + 8 * 3600000).toISOString(),
    odds: { h: '1.90', d: '3.20', a: '3.90' },
  },
];

const MOCK_ESPORTS_LIVE: SportEvent[] = [
  {
    id: 3001, sport: 'esports', sportKo: 'e스포츠',
    league: 'LCK', leagueKo: 'LCK Spring 2026', status: 'LIVE',
    leagueLogo: 'https://cdn.pandascore.co/images/league/image/4302/lck-logo.png',
    homeTeam: { name: 'T1', nameKo: 'T1', score: 1, logo: 'https://cdn.pandascore.co/images/team/image/126321/t1.png' },
    awayTeam: { name: 'Gen.G', nameKo: 'Gen.G', score: 1, logo: 'https://cdn.pandascore.co/images/team/image/131953/geng.png' },
    startTime: new Date(Date.now() - 90 * 60000).toISOString(),
    elapsed: 'LoL - Bo3 (2/3)', period: 'Bo3 Game 3',
    odds: { h: '1.80', d: 'VS', a: '1.95' },
  },
  {
    id: 3002, sport: 'esports', sportKo: 'e스포츠',
    league: 'BLAST Premier', leagueKo: 'CS2 - BLAST 프리미어', status: 'LIVE',
    leagueLogo: 'https://cdn.pandascore.co/images/league/image/4759/blast-premier.png',
    homeTeam: { name: 'NAVI', nameKo: 'NAVI', score: 1, logo: 'https://cdn.pandascore.co/images/team/image/125533/navi.png' },
    awayTeam: { name: 'FaZe Clan', nameKo: 'FaZe', score: 0, logo: 'https://cdn.pandascore.co/images/team/image/126282/faze.png' },
    startTime: new Date(Date.now() - 60 * 60000).toISOString(),
    elapsed: 'CS2 - Bo3 (1/3)', period: 'Bo3 Map 2',
    odds: { h: '2.10', d: 'VS', a: '1.70' },
  },
];

// ─── API Helpers ─────────────────────────────────────
async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── PandaScore API ──────────────────────────────────
async function fetchPandaScoreRunning(): Promise<SportEvent[]> {
  const key = config.pandaScore.apiKey;
  if (!key) return [];

  const cached = cacheGet<SportEvent[]>('pandascore:running');
  if (cached) return cached;

  const res = await fetchWithTimeout(
    `${config.pandaScore.baseUrl}/matches/running?per_page=50`,
    { 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' },
  );
  if (!res.ok) throw new Error(`PandaScore ${res.status}`);
  const matches = (await res.json()) as any[];

  const events: SportEvent[] = matches.map((m: any) => {
    const opponents = m.opponents || [];
    const home = opponents[0]?.opponent || {};
    const away = opponents[1]?.opponent || {};
    const results = m.results || [];
    const homeScore = results.find((r: any) => r.team_id === home.id)?.score;
    const awayScore = results.find((r: any) => r.team_id === away.id)?.score;
    const gameName = m.videogame?.name || 'Esports';
    const gameNameKo = PANDASCORE_GAME_NAME_KO[gameName] || gameName;
    const leagueName = m.league?.name || '';
    const serieName = m.serie?.full_name || m.serie?.name || '';
    const numberOfGames = m.number_of_games || 1;
    const gamesPlayed = (m.games || []).filter((g: any) => g.status === 'finished').length;

    return {
      id: m.id,
      sport: 'esports',
      sportKo: 'e스포츠',
      league: leagueName,
      leagueKo: serieName || leagueName,
      leagueLogo: m.league?.image_url || undefined,
      status: 'LIVE' as const,
      homeTeam: {
        name: home.name || 'TBD',
        nameKo: home.acronym || home.name || 'TBD',
        logo: home.image_url || undefined,
        score: homeScore ?? 0,
      },
      awayTeam: {
        name: away.name || 'TBD',
        nameKo: away.acronym || away.name || 'TBD',
        logo: away.image_url || undefined,
        score: awayScore ?? 0,
      },
      startTime: m.begin_at || new Date().toISOString(),
      elapsed: `${gameNameKo} - Bo${numberOfGames} (${gamesPlayed}/${numberOfGames})`,
      period: `Bo${numberOfGames} Game ${gamesPlayed + 1}`,
      odds: { h: ((1.5 + (m.id % 20) / 10)).toFixed(2), d: 'VS', a: ((1.5 + ((m.id + 7) % 20) / 10)).toFixed(2) },
    };
  });

  cacheSet('pandascore:running', events, 30_000);
  return events;
}

async function fetchPandaScoreUpcoming(): Promise<SportEvent[]> {
  const key = config.pandaScore.apiKey;
  if (!key) return [];

  const cached = cacheGet<SportEvent[]>('pandascore:upcoming');
  if (cached) return cached;

  const res = await fetchWithTimeout(
    `${config.pandaScore.baseUrl}/matches/upcoming?per_page=20&sort=begin_at`,
    { 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' },
  );
  if (!res.ok) throw new Error(`PandaScore ${res.status}`);
  const matches = (await res.json()) as any[];

  const events: SportEvent[] = matches.map((m: any) => {
    const opponents = m.opponents || [];
    const home = opponents[0]?.opponent || {};
    const away = opponents[1]?.opponent || {};
    const gameName = m.videogame?.name || 'Esports';
    const gameNameKo = PANDASCORE_GAME_NAME_KO[gameName] || gameName;
    const leagueName = m.league?.name || '';
    const serieName = m.serie?.full_name || m.serie?.name || '';
    const numberOfGames = m.number_of_games || 1;

    return {
      id: m.id,
      sport: 'esports',
      sportKo: 'e스포츠',
      league: leagueName,
      leagueKo: `${gameNameKo} - ${serieName || leagueName}`,
      leagueLogo: m.league?.image_url || undefined,
      status: 'SCHEDULED' as const,
      homeTeam: {
        name: home.name || 'TBD',
        nameKo: home.acronym || home.name || 'TBD',
        logo: home.image_url || undefined,
      },
      awayTeam: {
        name: away.name || 'TBD',
        nameKo: away.acronym || away.name || 'TBD',
        logo: away.image_url || undefined,
      },
      startTime: m.begin_at || new Date().toISOString(),
      period: `Bo${numberOfGames}`,
      odds: { h: ((1.5 + (m.id % 20) / 10)).toFixed(2), d: 'VS', a: ((1.5 + ((m.id + 7) % 20) / 10)).toFixed(2) },
    };
  });

  cacheSet('pandascore:upcoming', events, 120_000);
  return events;
}

// ─── API-Football ────────────────────────────────────
async function fetchFootballLive(): Promise<SportEvent[]> {
  const key = config.apiFootball.apiKey;
  if (!key) return [];

  const cached = cacheGet<SportEvent[]>('apifootball:live');
  if (cached) return cached;

  const res = await fetchWithTimeout(
    `${config.apiFootball.baseUrl}/fixtures?live=all`,
    { 'x-apisports-key': key },
  );
  if (!res.ok) throw new Error(`API-Football ${res.status}`);
  const data: any = await res.json();
  const fixtures: any[] = data.response || [];

  const events: SportEvent[] = fixtures.map((f: any) => {
    const statusShort = f.fixture?.status?.short || '';
    const statusInfo = FOOTBALL_STATUS_MAP[statusShort] || { period: statusShort, isLive: true };
    const elapsed = f.fixture?.status?.elapsed;
    const leagueName = f.league?.name || '';
    const leagueCountry = f.league?.country || '';
    const homeName = f.teams?.home?.name || 'TBD';
    const awayName = f.teams?.away?.name || 'TBD';

    return {
      id: f.fixture?.id || 0,
      sport: 'football',
      sportKo: '축구',
      league: leagueName,
      leagueKo: LEAGUE_NAME_KO[leagueName] || `${leagueName} (${leagueCountry})`,
      leagueLogo: f.league?.logo || undefined,
      countryFlag: f.league?.flag || undefined,
      countryName: COUNTRY_NAME_KO[leagueCountry] || leagueCountry,
      status: 'LIVE' as const,
      homeTeam: {
        name: homeName,
        nameKo: TEAM_NAME_KO[homeName] || homeName,
        logo: f.teams?.home?.logo || undefined,
        score: f.goals?.home ?? 0,
      },
      awayTeam: {
        name: awayName,
        nameKo: TEAM_NAME_KO[awayName] || awayName,
        logo: f.teams?.away?.logo || undefined,
        score: f.goals?.away ?? 0,
      },
      startTime: f.fixture?.date || new Date().toISOString(),
      elapsed: elapsed ? `${elapsed}'` : statusInfo.period,
      period: statusInfo.period,
      odds: (() => {
        const eid = f.fixture?.id || 0;
        const s = eid * 7;
        return {
          h: (1.5 + ((s % 30) / 10)).toFixed(2),
          d: (2.8 + ((s % 15) / 10)).toFixed(2),
          a: (2.0 + ((s % 25) / 10)).toFixed(2),
        };
      })(),
    };
  });

  // API-Football free plan: 100 req/day → cache 5 min
  cacheSet('apifootball:live', events, 300_000);
  return events;
}

async function fetchFootballScheduled(): Promise<SportEvent[]> {
  const key = config.apiFootball.apiKey;
  if (!key) return [];

  const cached = cacheGet<SportEvent[]>('apifootball:scheduled');
  if (cached) return cached;

  const today = new Date().toISOString().split('T')[0];
  const res = await fetchWithTimeout(
    `${config.apiFootball.baseUrl}/fixtures?date=${today}&status=NS-TBD`,
    { 'x-apisports-key': key },
  );
  if (!res.ok) throw new Error(`API-Football ${res.status}`);
  const data: any = await res.json();
  const fixtures: any[] = data.response || [];

  const events: SportEvent[] = fixtures.slice(0, 30).map((f: any) => {
    const leagueName = f.league?.name || '';
    const leagueCountry = f.league?.country || '';
    const homeName = f.teams?.home?.name || 'TBD';
    const awayName = f.teams?.away?.name || 'TBD';

    return {
      id: f.fixture?.id || 0,
      sport: 'football',
      sportKo: '축구',
      league: leagueName,
      leagueKo: LEAGUE_NAME_KO[leagueName] || `${leagueName} (${leagueCountry})`,
      leagueLogo: f.league?.logo || undefined,
      countryFlag: f.league?.flag || undefined,
      countryName: COUNTRY_NAME_KO[leagueCountry] || leagueCountry,
      status: 'SCHEDULED' as const,
      homeTeam: {
        name: homeName,
        nameKo: TEAM_NAME_KO[homeName] || homeName,
        logo: f.teams?.home?.logo || undefined,
      },
      awayTeam: {
        name: awayName,
        nameKo: TEAM_NAME_KO[awayName] || awayName,
        logo: f.teams?.away?.logo || undefined,
      },
      startTime: f.fixture?.date || new Date().toISOString(),
      odds: (() => {
        const eid = f.fixture?.id || 0;
        const s = eid * 7;
        return {
          h: (1.5 + ((s % 30) / 10)).toFixed(2),
          d: (2.8 + ((s % 15) / 10)).toFixed(2),
          a: (2.0 + ((s % 25) / 10)).toFixed(2),
        };
      })(),
    };
  });

  // Scheduled fixtures: cache 30 min (changes rarely)
  cacheSet('apifootball:scheduled', events, 1_800_000);
  return events;
}

// ─── Odds (mock-based, no live odds API available) ───
const BOOKMAKER_NAMES: Record<string, string> = {
  bet365: '벳365',
  pinnacle: '피나클',
  '1xbet': '원엑스벳',
  stake: '스테이크',
  betfair: '베트페어',
  bwin: '비윈',
  unibet: '유니벳',
};

const generateOdds = (eventId: number): EventOdds => {
  const seed = eventId * 7;
  const homeBase = 1.5 + ((seed % 30) / 10);
  const drawBase = 2.8 + ((seed % 15) / 10);
  const awayBase = 2.0 + ((seed % 25) / 10);
  const bookmakerKeys = Object.keys(BOOKMAKER_NAMES);

  const bookmakers: BookmakerOdds[] = bookmakerKeys.map((key, idx) => {
    const variance = ((idx * 3 + seed) % 20 - 10) / 100;
    return {
      bookmaker: key,
      bookmakerKo: BOOKMAKER_NAMES[key],
      markets: [
        {
          type: '1X2',
          outcomes: [
            { name: '홈 승', odds: parseFloat((homeBase + variance).toFixed(2)) },
            { name: '무승부', odds: parseFloat((drawBase + variance * 0.5).toFixed(2)) },
            { name: '원정 승', odds: parseFloat((awayBase - variance).toFixed(2)) },
          ],
        },
        {
          type: 'Over/Under 2.5',
          outcomes: [
            { name: '오버 2.5', odds: parseFloat((1.7 + variance * 0.8).toFixed(2)) },
            { name: '언더 2.5', odds: parseFloat((2.1 - variance * 0.8).toFixed(2)) },
          ],
        },
      ],
      updatedAt: new Date().toISOString(),
    };
  });

  return { eventId, bookmakers };
};

// ─── Service ─────────────────────────────────────────
export class SportsService {
  async getLiveEvents(sport?: string): Promise<SportEvent[]> {
    const results: SportEvent[] = [];

    // Fetch football live from API-Football
    if (!sport || sport === 'football') {
      try {
        const footballEvents = await fetchFootballLive();
        if (footballEvents.length > 0) {
          results.push(...footballEvents);
        } else {
          results.push(...MOCK_LIVE_EVENTS.filter((e) => e.sport === 'football'));
        }
      } catch {
        results.push(...MOCK_LIVE_EVENTS.filter((e) => e.sport === 'football'));
      }
    }

    // Fetch esports live from PandaScore
    if (!sport || sport === 'esports') {
      try {
        const esportsEvents = await fetchPandaScoreRunning();
        if (esportsEvents.length > 0) {
          results.push(...esportsEvents);
        } else {
          results.push(...MOCK_ESPORTS_LIVE);
        }
      } catch {
        results.push(...MOCK_ESPORTS_LIVE);
      }
    }

    // For other sports, add mock data (no real API yet)
    if (!sport) {
      results.push(...MOCK_LIVE_EVENTS.filter((e) => e.sport !== 'football' && e.sport !== 'esports'));
    } else if (sport !== 'football' && sport !== 'esports') {
      return MOCK_LIVE_EVENTS.filter((e) => e.sport === sport);
    }

    return results;
  }

  async getScheduledEvents(sport?: string): Promise<SportEvent[]> {
    const results: SportEvent[] = [];

    if (!sport || sport === 'football') {
      try {
        const footballEvents = await fetchFootballScheduled();
        if (footballEvents.length > 0) {
          results.push(...footballEvents);
        } else {
          results.push(...MOCK_SCHEDULED_EVENTS.filter((e) => e.sport === 'football'));
        }
      } catch {
        results.push(...MOCK_SCHEDULED_EVENTS.filter((e) => e.sport === 'football'));
      }
    }

    if (!sport || sport === 'esports') {
      try {
        const esportsEvents = await fetchPandaScoreUpcoming();
        if (esportsEvents.length > 0) {
          results.push(...esportsEvents);
        } else {
          // No mock scheduled esports
        }
      } catch {
        // No mock scheduled esports
      }
    }

    if (sport && sport !== 'football' && sport !== 'esports') {
      return MOCK_SCHEDULED_EVENTS.filter((e) => e.sport === sport);
    }

    return results;
  }

  async getEventOdds(eventId: number): Promise<EventOdds> {
    // No live odds API available - use generated odds
    return generateOdds(eventId);
  }

  getSportCategories(): SportCategory[] {
    return SPORT_CATEGORIES;
  }

  getEsportsCategories(): EsportsCategory[] {
    return ESPORTS_CATEGORIES;
  }

  async getEsportsLive(): Promise<SportEvent[]> {
    try {
      const events = await fetchPandaScoreRunning();
      if (events.length > 0) return events;
    } catch {
      // Fall back to mock
    }
    return [...MOCK_ESPORTS_LIVE];
  }
}
