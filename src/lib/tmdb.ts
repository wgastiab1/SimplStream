import { CONFIG } from '../config';

const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  es: 'es-MX',
  it: 'it-IT',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
};

export async function tmdbFetch(path: string, language: string = 'en') {
  const tmdbLang = LANG_MAP[language] || 'en-US';
  
  if (CONFIG.USE_BACKEND) {
    try {
      let backendPath = '';
      if (path.includes('/search/multi')) {
        const query = new URLSearchParams(path.split('?')[1]).get('query');
        backendPath = `/api/search?query=${query}`;
      } else if (path.includes('/trending/all/day')) {
        backendPath = `/api/trending?media_type=all`;
      } else if (path.match(/\/(movie|tv)\/\d+$/)) {
        const parts = path.split('/');
        backendPath = `/api/details/${parts[1]}/${parts[2]}`;
      }

      if (backendPath) {
        const url = `${CONFIG.BACKEND_URL}${backendPath}`;
        console.log(`[WilStream] Backend Fetch: ${url}`);
        const res = await fetch(url);
        if (res.ok) return res.json();
      }
    } catch (e) {
      console.error('Backend fetch failed, falling back to direct TMDB', e);
    }
  }

  const url = `${CONFIG.TMDB_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${CONFIG.TMDB_KEY}&language=${tmdbLang}`;
  console.log(`[WilStream] TMDB Fetch (Direct): ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error('TMDB error ' + res.status);
  return res.json();
}


export function getTMDBImageUrl(path: string | null, size: string = 'w780'): string {
  if (!path) return '/placeholder.svg';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}


const SUB_LANG_MAP: Record<string, string> = {
  en: 'eng',
  es: 'spa',
  it: 'ita',
  fr: 'fre',
  de: 'ger',
  pt: 'por',
};

export const EMBED_PROVIDERS = {
  vidsrc: (type: string, tmdbId: number, season?: number, episode?: number, language: string = 'en') => {
    const sub = SUB_LANG_MAP[language] || 'eng';
    if (type === 'movie') return `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}&sub_lang=${sub}`;
    if (type === 'tv') return `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}&sub_lang=${sub}`;
    return '';
  },
  vidlink: (type: string, tmdbId: number, season?: number, episode?: number, language: string = 'en') => {
    const sub = SUB_LANG_MAP[language] || 'eng';
    if (type === 'movie') return `https://vidlink.pro/movie/${tmdbId}?sub_lang=${sub}`;
    if (type === 'tv') return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?sub_lang=${sub}`;
    return '';
  },
  '111movies': (type: string, tmdbId: number, season?: number, episode?: number) => {
    if (type === 'movie') return `https://111movies.com/movie/${tmdbId}`;
    if (type === 'tv') return `https://111movies.com/tv/${tmdbId}/${season}/${episode}`;
    return '';
  },
  videasy: (type: string, tmdbId: number, season?: number, episode?: number) => {
    if (type === 'movie') return `https://player.videasy.net/movie/${tmdbId}?color=3B82F6`;
    if (type === 'tv') return `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}?color=3B82F6`;
    return '';
  },
  vidfast: (type: string, tmdbId: number, season?: number, episode?: number) => {
    if (type === 'movie') return `https://vidfast.pro/movie/${tmdbId}?theme=2980B9&autoPlay=true`;
    if (type === 'tv') return `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}?theme=2980B9&autoPlay=true&nextButton=true`;
    return '';
  },
  fede: (type: string, tmdbId: number, season?: number, episode?: number) => {
    if (type === 'movie') return `https://fede.stream/embed/movie/${tmdbId}`;
    if (type === 'tv') return `https://fede.stream/embed/tv/${tmdbId}/${season}/${episode}`;
    return '';
  },
  wolfstream: (type: string, tmdbId: number, season?: number, episode?: number) => {
    if (type === 'movie') return `https://wolf-stream.com/embed/movie/${tmdbId}`;
    if (type === 'tv') return `https://wolf-stream.com/embed/tv/${tmdbId}/${season}/${episode}`;
    return '';
  }
};


