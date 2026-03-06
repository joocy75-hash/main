import type { SportEvent } from '@/stores/sports-store';

/* ───────────────── Sport Icons ───────────────── */

export const SPORT_ICONS: Record<string, string> = {
  football: '\u26BD', basketball: '\uD83C\uDFC0', hockey: '\uD83C\uDFD2', baseball: '\u26BE',
  tennis: '\uD83C\uDFBE', volleyball: '\uD83C\uDFD0', mma: '\uD83E\uDD4A', esports: '\uD83C\uDFAE',
};

/* ───────────────── Country Flag Map ───────────────── */

export const COUNTRY_FLAG_MAP: Record<string, string> = {
  '\uCF5C\uB86C\uBE44\uC544':'\uD83C\uDDE8\uD83C\uDDF4', 'Colombia':'\uD83C\uDDE8\uD83C\uDDF4',
  '\uACFC\uD14C\uB9D0\uB77C':'\uD83C\uDDEC\uD83C\uDDF9', 'Guatemala':'\uD83C\uDDEC\uD83C\uDDF9',
  '\uB77C\uB9AC\uAC00':'\uD83C\uDDEA\uD83C\uDDF8', '\uC2A4\uD398\uC778':'\uD83C\uDDEA\uD83C\uDDF8', 'Spain':'\uD83C\uDDEA\uD83C\uDDF8',
  '\uD504\uB9AC\uBBF8\uC5B4\uB9AC\uADF8':'\uD83C\uDDEC\uD83C\uDDE7', '\uC789\uAE00\uB79C\uB4DC':'\uD83C\uDDEC\uD83C\uDDE7', 'England':'\uD83C\uDDEC\uD83C\uDDE7',
  '\uCC54\uD53C\uC5B8\uC2A4':'\uD83C\uDDEA\uD83C\uDDFA', 'Europe':'\uD83C\uDDEA\uD83C\uDDFA', '\uC720\uB7FD':'\uD83C\uDDEA\uD83C\uDDFA',
  'NBA':'\uD83C\uDDFA\uD83C\uDDF8', 'NHL':'\uD83C\uDDFA\uD83C\uDDF8', 'MLB':'\uD83C\uDDFA\uD83C\uDDF8', 'NFL':'\uD83C\uDDFA\uD83C\uDDF8', 'MLS':'\uD83C\uDDFA\uD83C\uDDF8', '\uBBF8\uAD6D':'\uD83C\uDDFA\uD83C\uDDF8', 'USA':'\uD83C\uDDFA\uD83C\uDDF8',
  'LCK':'\uD83C\uDDF0\uD83C\uDDF7', '\uD55C\uAD6D':'\uD83C\uDDF0\uD83C\uDDF7', '\uB300\uD55C\uBBFC\uAD6D':'\uD83C\uDDF0\uD83C\uDDF7', 'Korea':'\uD83C\uDDF0\uD83C\uDDF7', 'KBO':'\uD83C\uDDF0\uD83C\uDDF7', 'K\uB9AC\uADF8':'\uD83C\uDDF0\uD83C\uDDF7',
  '\uBE0C\uB77C\uC9C8':'\uD83C\uDDE7\uD83C\uDDF7', 'Brazil':'\uD83C\uDDE7\uD83C\uDDF7',
  '\uC544\uB974\uD5E8\uD2F0\uB098':'\uD83C\uDDE6\uD83C\uDDF7', 'Argentina':'\uD83C\uDDE6\uD83C\uDDF7',
  '\uC774\uD0C8\uB9AC\uC544':'\uD83C\uDDEE\uD83C\uDDF9', 'Italy':'\uD83C\uDDEE\uD83C\uDDF9',
  '\uB3C5\uC77C':'\uD83C\uDDE9\uD83C\uDDEA', 'Germany':'\uD83C\uDDE9\uD83C\uDDEA',
  '\uD504\uB791\uC2A4':'\uD83C\uDDEB\uD83C\uDDF7', 'France':'\uD83C\uDDEB\uD83C\uDDF7',
  '\uC77C\uBCF8':'\uD83C\uDDEF\uD83C\uDDF5', 'Japan':'\uD83C\uDDEF\uD83C\uDDF5', 'NPB':'\uD83C\uDDEF\uD83C\uDDF5',
  '\uC911\uAD6D':'\uD83C\uDDE8\uD83C\uDDF3', 'China':'\uD83C\uDDE8\uD83C\uDDF3',
  '\uD3EC\uB974\uD22C\uAC08':'\uD83C\uDDF5\uD83C\uDDF9', 'Portugal':'\uD83C\uDDF5\uD83C\uDDF9',
  '\uB124\uB35C\uB780\uB4DC':'\uD83C\uDDF3\uD83C\uDDF1', 'Netherlands':'\uD83C\uDDF3\uD83C\uDDF1',
  '\uD130\uD0A4':'\uD83C\uDDF9\uD83C\uDDF7', 'Turkey':'\uD83C\uDDF9\uD83C\uDDF7', 'T\u00FCrkiye':'\uD83C\uDDF9\uD83C\uDDF7',
  '\uBCA8\uAE30\uC5D0':'\uD83C\uDDE7\uD83C\uDDEA', 'Belgium':'\uD83C\uDDE7\uD83C\uDDEA',
  '\uC2A4\uC704\uC2A4':'\uD83C\uDDE8\uD83C\uDDED', 'Switzerland':'\uD83C\uDDE8\uD83C\uDDED',
  '\uC624\uC2A4\uD2B8\uB9AC\uC544':'\uD83C\uDDE6\uD83C\uDDF9', 'Austria':'\uD83C\uDDE6\uD83C\uDDF9',
  '\uC2A4\uCF54\uD2C0\uB79C\uB4DC':'\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74\uDB40\uDC7F', 'Scotland':'\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74\uDB40\uDC7F',
  '\uB7EC\uC2DC\uC544':'\uD83C\uDDF7\uD83C\uDDFA', 'Russia':'\uD83C\uDDF7\uD83C\uDDFA',
  '\uC6B0\uD06C\uB77C\uC774\uB098':'\uD83C\uDDFA\uD83C\uDDE6', 'Ukraine':'\uD83C\uDDFA\uD83C\uDDE6',
  '\uBA55\uC2DC\uCF54':'\uD83C\uDDF2\uD83C\uDDFD', 'Mexico':'\uD83C\uDDF2\uD83C\uDDFD',
  '\uD638\uC8FC':'\uD83C\uDDE6\uD83C\uDDFA', 'Australia':'\uD83C\uDDE6\uD83C\uDDFA',
  '\uC0AC\uC6B0\uB514':'\uD83C\uDDF8\uD83C\uDDE6', 'Saudi':'\uD83C\uDDF8\uD83C\uDDE6',
  '\uADF8\uB9AC\uC2A4':'\uD83C\uDDEC\uD83C\uDDF7', 'Greece':'\uD83C\uDDEC\uD83C\uDDF7',
  '\uB374\uB9C8\uD06C':'\uD83C\uDDE9\uD83C\uDDF0', 'Denmark':'\uD83C\uDDE9\uD83C\uDDF0',
  '\uC2A4\uC6E8\uB374':'\uD83C\uDDF8\uD83C\uDDEA', 'Sweden':'\uD83C\uDDF8\uD83C\uDDEA',
  '\uB178\uB974\uC6E8\uC774':'\uD83C\uDDF3\uD83C\uDDF4', 'Norway':'\uD83C\uDDF3\uD83C\uDDF4',
  '\uD3F4\uB780\uB4DC':'\uD83C\uDDF5\uD83C\uDDF1', 'Poland':'\uD83C\uDDF5\uD83C\uDDF1',
  '\uCCB4\uCF54':'\uD83C\uDDE8\uD83C\uDDFF', 'Czech':'\uD83C\uDDE8\uD83C\uDDFF',
  '\uD06C\uB85C\uC544\uD2F0\uC544':'\uD83C\uDDED\uD83C\uDDF7', 'Croatia':'\uD83C\uDDED\uD83C\uDDF7',
  '\uC138\uB974\uBE44\uC544':'\uD83C\uDDF7\uD83C\uDDF8', 'Serbia':'\uD83C\uDDF7\uD83C\uDDF8',
  '\uB8E8\uB9C8\uB2C8\uC544':'\uD83C\uDDF7\uD83C\uDDF4', 'Romania':'\uD83C\uDDF7\uD83C\uDDF4',
  '\uCE90\uB098\uB2E4':'\uD83C\uDDE8\uD83C\uDDE6', 'Canada':'\uD83C\uDDE8\uD83C\uDDE6',
  '\uCE60\uB808':'\uD83C\uDDE8\uD83C\uDDF1', 'Chile':'\uD83C\uDDE8\uD83C\uDDF1',
  '\uD30C\uB77C\uACFC\uC774':'\uD83C\uDDF5\uD83C\uDDFE', 'Paraguay':'\uD83C\uDDF5\uD83C\uDDFE',
  '\uC6B0\uB8E8\uACFC\uC774':'\uD83C\uDDFA\uD83C\uDDFE', 'Uruguay':'\uD83C\uDDFA\uD83C\uDDFE',
  '\uD398\uB8E8':'\uD83C\uDDF5\uD83C\uDDEA', 'Peru':'\uD83C\uDDF5\uD83C\uDDEA',
  '\uC5D0\uCF70\uB3C4\uB974':'\uD83C\uDDEA\uD83C\uDDE8', 'Ecuador':'\uD83C\uDDEA\uD83C\uDDE8',
  '\uC774\uB780':'\uD83C\uDDEE\uD83C\uDDF7', 'Iran':'\uD83C\uDDEE\uD83C\uDDF7',
  '\uC778\uB3C4':'\uD83C\uDDEE\uD83C\uDDF3', 'India':'\uD83C\uDDEE\uD83C\uDDF3',
  '\uD0DC\uAD6D':'\uD83C\uDDF9\uD83C\uDDED', 'Thailand':'\uD83C\uDDF9\uD83C\uDDED',
  '\uBCA0\uD2B8\uB0A8':'\uD83C\uDDFB\uD83C\uDDF3', 'Vietnam':'\uD83C\uDDFB\uD83C\uDDF3',
  '\uC778\uB3C4\uB124\uC2DC\uC544':'\uD83C\uDDEE\uD83C\uDDE9', 'Indonesia':'\uD83C\uDDEE\uD83C\uDDE9',
  '\uC774\uC9D1\uD2B8':'\uD83C\uDDEA\uD83C\uDDEC', 'Egypt':'\uD83C\uDDEA\uD83C\uDDEC',
  '\uB0A8\uC544\uACF5':'\uD83C\uDDFF\uD83C\uDDE6', 'South Africa':'\uD83C\uDDFF\uD83C\uDDE6',
  '\uBAA8\uB85C\uCF54':'\uD83C\uDDF2\uD83C\uDDE6', 'Morocco':'\uD83C\uDDF2\uD83C\uDDE6',
  '\uB098\uC774\uC9C0\uB9AC\uC544':'\uD83C\uDDF3\uD83C\uDDEC', 'Nigeria':'\uD83C\uDDF3\uD83C\uDDEC',
  '\uAD6D\uC81C':'\uD83C\uDF0D', 'World':'\uD83C\uDF0D', 'International':'\uD83C\uDF0D',
};

/* ───────────────── League Translations ───────────────── */

export const LEAGUE_TRANSLATIONS: Record<string, string> = {
  'Premier League': '\uD504\uB9AC\uBBF8\uC5B4\uB9AC\uADF8',
  'La Liga': '\uB77C\uB9AC\uAC00',
  'Bundesliga': '\uBD84\uB370\uC2A4\uB9AC\uAC00',
  'Serie A': '\uC138\uB9AC\uC5D0 A',
  'Ligue 1': '\uB9AC\uADF8 1',
  'Champions League': '\uCC54\uD53C\uC5B8\uC2A4\uB9AC\uADF8',
  'Europa League': '\uC720\uB85C\uD30C\uB9AC\uADF8',
  'Europa Conference League': '\uCEE8\uD37C\uB7F0\uC2A4\uB9AC\uADF8',
  'FA Cup': 'FA\uCEF5',
  'Copa del Rey': '\uCF54\uD30C \uB378 \uB808\uC774',
  'DFB Pokal': 'DFB \uD3EC\uCE7C',
  'Coppa Italia': '\uCF54\uD30C \uC774\uD0C8\uB9AC\uC544',
  'Coupe de France': '\uCFE0\uD504 \uB4DC \uD504\uB791\uC2A4',
  'EFL Championship': 'EFL \uCC54\uD53C\uC5B8\uC2ED',
  'EFL Cup': 'EFL\uCEF5',
  'Eredivisie': '\uC5D0\uB808\uB514\uBE44\uC2DC',
  'Primeira Liga': '\uD504\uB9AC\uBA54\uC774\uB77C\uB9AC\uAC00',
  'Super Lig': '\uC26C\uD398\uB974\uB9AC\uADF8',
  'Scottish Premiership': '\uC2A4\uCF54\uD2F0\uC2DC \uD504\uB9AC\uBBF8\uC5B4\uC2ED',
  'Pro League': '\uD504\uB85C\uB9AC\uADF8',
  'Super League': '\uC288\uD37C\uB9AC\uADF8',
  'Bundesliga 2': '\uBD84\uB370\uC2A4\uB9AC\uAC00 2',
  'Serie B': '\uC138\uB9AC\uC5D0 B',
  'Ligue 2': '\uB9AC\uADF8 2',
  'Segunda Division': '\uC138\uAD70\uB2E4',
  'J1 League': 'J1\uB9AC\uADF8',
  'J2 League': 'J2\uB9AC\uADF8',
  'K League 1': 'K\uB9AC\uADF81',
  'K League 2': 'K\uB9AC\uADF82',
  'A-League': 'A\uB9AC\uADF8',
  'MLS': 'MLS',
  'Liga MX': '\uB9AC\uAC00 MX',
  'Copa Libertadores': '\uCF54\uD30C \uB9AC\uBCA0\uB974\uD0C0\uB3C4\uB808\uC2A4',
  'Copa Sudamericana': '\uCF54\uD30C \uC218\uB2E4\uBA54\uB9AC\uCE74\uB098',
  'Copa do Brasil': '\uCF54\uD30C \uB450 \uBE0C\uB77C\uC9C8',
  'Brasileir\u00E3o S\u00E9rie A': '\uBE0C\uB77C\uC9C8\uB808\uC774\uB791',
  'Argentine Primera': '\uC544\uB974\uD5E8\uD2F0\uB098 \uD504\uB9AC\uBA54\uB77C',
  'World Cup Qualifiers': '\uC6D4\uB4DC\uCEF5 \uC608\uC120',
  'UEFA Nations League': 'UEFA \uB124\uC774\uC158\uC2A4\uB9AC\uADF8',
  'International Friendly': '\uAD6D\uC81C \uCE5C\uC120\uACBD\uAE30',
  'AFC Champions League': 'AFC \uCC54\uD53C\uC5B8\uC2A4\uB9AC\uADF8',
  'NBA': 'NBA',
  'NHL': 'NHL',
  'MLB': 'MLB',
  'NFL': 'NFL',
  'KBO': 'KBO',
  'NPB': 'NPB',
  'KBL': 'KBL',
  'ATP': 'ATP \uD22C\uC5B4',
  'WTA': 'WTA \uD22C\uC5B4',
};

/* ───────────────── Helpers ───────────────── */

export function findFlag(text: string): string | null {
  for (const [key, value] of Object.entries(COUNTRY_FLAG_MAP)) {
    if (text.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return null;
}

export function getFlagAndName(lg: string, ev?: SportEvent): { flag: string; displayName: string } {
  let cleanedName = lg;
  let countryStr = '';
  const match = lg.match(/(.*?)\s*\((.*?)\)$/);
  if (match) { cleanedName = match[1].trim(); countryStr = match[2].trim(); }
  const flag =
    (ev?.countryName && findFlag(ev.countryName)) ||
    (countryStr && findFlag(countryStr)) ||
    findFlag(cleanedName) ||
    '\uD83C\uDF10';
  const displayName = LEAGUE_TRANSLATIONS[cleanedName] || cleanedName;
  return { flag, displayName };
}

/* ───────────────── Bet Types ───────────────── */

export interface Bet {
  eventId: number;
  type: string;
  label: string;
  odds: number;
  home: string;
  away: string;
  league: string;
}
