export interface ExternalLinkItem {
  id: string;
  label: string;
  url: string;
  type: 'imdb' | 'homepage' | 'wikidata' | 'instagram' | 'twitter';
}

/**
 * Builds and validates external profiles and links from title details.
 * Only returns entries that have valid, non-empty identifiers or URLs.
 */
export function buildExternalLinks(details: any): ExternalLinkItem[] {
  if (!details) return [];

  const links: ExternalLinkItem[] = [];
  const ext = details.external_ids || {};

  // 1. IMDb
  if (ext.imdb_id && typeof ext.imdb_id === 'string' && ext.imdb_id.trim()) {
    const cleanId = ext.imdb_id.trim();
    links.push({
      id: 'imdb',
      label: 'IMDb',
      url: `https://www.imdb.com/title/${cleanId}`,
      type: 'imdb',
    });
  }

  // 2. Official Website / Homepage
  if (details.homepage && typeof details.homepage === 'string' && details.homepage.trim()) {
    try {
      const parsed = new URL(details.homepage.trim());
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        links.push({
          id: 'homepage',
          label: 'Official Site',
          url: parsed.href,
          type: 'homepage',
        });
      }
    } catch {
      // Invalid URL skipped
    }
  }

  // 3. Wikidata (Strictly labeled "Wikidata", never "Wikipedia")
  if (ext.wikidata_id && typeof ext.wikidata_id === 'string' && ext.wikidata_id.trim()) {
    const cleanId = ext.wikidata_id.trim();
    links.push({
      id: 'wikidata',
      label: 'Wikidata',
      url: `https://www.wikidata.org/wiki/${cleanId}`,
      type: 'wikidata',
    });
  }

  // 4. Instagram
  if (ext.instagram_id && typeof ext.instagram_id === 'string' && ext.instagram_id.trim()) {
    const cleanId = ext.instagram_id.trim().replace(/^@/, '');
    links.push({
      id: 'instagram',
      label: 'Instagram',
      url: `https://instagram.com/${cleanId}`,
      type: 'instagram',
    });
  }

  // 5. X / Twitter
  if (ext.twitter_id && typeof ext.twitter_id === 'string' && ext.twitter_id.trim()) {
    const cleanId = ext.twitter_id.trim().replace(/^@/, '');
    links.push({
      id: 'twitter',
      label: 'X (Twitter)',
      url: `https://x.com/${cleanId}`,
      type: 'twitter',
    });
  }

  return links;
}

