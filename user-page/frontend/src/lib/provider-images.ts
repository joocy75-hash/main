/**
 * Provider image resolution utility.
 * Maps Gamblly API provider codes and names to existing logo assets.
 *
 * Verified against live Gamblly API (2026-03-08): 46 active providers.
 * Note: Gamblly API does NOT provide image URLs (games.php/providers.php).
 * All images come from local assets only.
 */

// Provider short code → image path (primary lookup)
const CODE_TO_IMAGE: Record<string, string> = {
  // Active providers (matched to current API response)
  'PLAYTECHEU': '/images/providers/playtech.webp',
  'EVOLIVEROW': '/images/providers/evolution.webp',
  'JL': '/images/providers/jili.webp',
  'PG': '/images/providers/pg.webp',
  'EZUGI': '/images/providers/ezugi.webp',
  'FACHAI': '/images/providers/fc_slot.webp',
  'SMARTSOFT': '/images/providers/spribe.webp',
  'SABA': '/images/providers/saba.webp',
  // Legacy codes (may become active again)
  'PTASIA': '/images/providers/playtech.webp',
  'PP': '/images/providers/pragmatic_play.webp',
  'PPLIVE': '/images/providers/pragmatic_play.webp',
  'MG': '/images/provider-filters/202406110001.webp',
  'HABANERO': '/images/provider-filters/202203181001.webp',
  'KM': '/images/providers/kingmaker.webp',
  'SPRIBE': '/images/providers/spribe.webp',
};

// Provider name (lowercase) → image path (fallback for name-based matching)
const NAME_TO_IMAGE: Record<string, string> = {
  'playtech eu': '/images/providers/playtech.webp',
  'playtech asia': '/images/providers/playtech.webp',
  'evolution live row': '/images/providers/evolution.webp',
  'evolution': '/images/providers/evolution.webp',
  'evolution gaming': '/images/providers/evolution.webp',
  'jili': '/images/providers/jili.webp',
  'pgsoft': '/images/providers/pg.webp',
  'pg soft': '/images/providers/pg.webp',
  'ezugi': '/images/providers/ezugi.webp',
  'fachai': '/images/providers/fc_slot.webp',
  'fc': '/images/providers/fc_slot.webp',
  'smartsoft': '/images/providers/spribe.webp',
  'saba': '/images/providers/saba.webp',
  'pp': '/images/providers/pragmatic_play.webp',
  'pp live': '/images/providers/pragmatic_play.webp',
  'pragmatic play': '/images/providers/pragmatic_play.webp',
  'mg': '/images/provider-filters/202406110001.webp',
  'microgaming': '/images/provider-filters/202406110001.webp',
  'habanero': '/images/provider-filters/202203181001.webp',
  'km': '/images/providers/kingmaker.webp',
  'kingmaker': '/images/providers/kingmaker.webp',
  'spribe': '/images/providers/spribe.webp',
  'bti': '/images/providers/bti.webp',
  'im': '/images/providers/im.webp',
  'og': '/images/providers/og.webp',
  'mwg': '/images/providers/mwg.webp',
  'marblemagic': '/images/providers/marblemagic.webp',
};

/**
 * Returns the best available image path for a provider, or null.
 * Priority: apiImageUrl → code-based → name-based → null
 */
export function getProviderImage(code: string, name: string, apiImageUrl?: string): string | null {
  if (apiImageUrl) {
    return apiImageUrl;
  }

  if (CODE_TO_IMAGE[code]) {
    return CODE_TO_IMAGE[code];
  }

  const img = NAME_TO_IMAGE[name.toLowerCase().trim()];
  if (img) {
    return img;
  }

  return null;
}

/**
 * Returns true if we have a known logo for this provider.
 */
export function hasProviderImage(code: string, name: string, apiImageUrl?: string): boolean {
  return getProviderImage(code, name, apiImageUrl) !== null;
}
