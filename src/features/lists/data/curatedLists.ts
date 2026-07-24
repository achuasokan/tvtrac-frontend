export interface CuratedListDef {
  id: string;
  name: string;
  description: string;
  creator: string;
  badge: string;
  tag: string;
  totalCount: number;
  bannerGradient: string;
  fetchParams: {
    type: 'movie' | 'tv';
    params: Record<string, string>;
  };
}

export const FEATURED_LISTS: CuratedListDef[] = [
  {
    id: "curated-top-50-anime",
    name: "Top 50 Anime",
    description: "The highest-rated Japanese animated series of all time.",
    creator: "tvtrac",
    badge: "Official",
    tag: "Anime",
    totalCount: 50,
    bannerGradient: "from-amber-900/40 via-zinc-900 to-zinc-950",
    fetchParams: {
      type: "tv",
      params: {
        with_genres: "16",
        with_original_language: "ja",
        "vote_count.gte": "200",
        sort_by: "vote_average.desc"
      }
    }
  },
  {
    id: "curated-100-greatest-shows",
    name: "100 Greatest TV Shows",
    description: "The top-rated television series of all time across all genres.",
    creator: "tvtrac",
    badge: "Official",
    tag: "TV Shows",
    totalCount: 100,
    bannerGradient: "from-blue-900/40 via-zinc-900 to-zinc-950",
    fetchParams: {
      type: "tv",
      params: {
        "vote_count.gte": "1000",
        sort_by: "vote_average.desc"
      }
    }
  },
  {
    id: "curated-top-250-movies",
    name: "Top 250 Movies",
    description: "The essential cinema collection — top 250 highest-rated films.",
    creator: "tvtrac",
    badge: "Official",
    tag: "Movies",
    totalCount: 250,
    bannerGradient: "from-purple-900/40 via-zinc-900 to-zinc-950",
    fetchParams: {
      type: "movie",
      params: {
        "vote_count.gte": "10000",
        sort_by: "vote_average.desc",
        without_genres: "99,10770"
      }
    }
  }
];
