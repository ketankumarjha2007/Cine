import { env } from '../config/env.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const tmdbService = {
  async fetchFromTmdb(endpoint, params = {}) {
    if (!env.TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured on server.');
    }

    const query = new URLSearchParams({
      api_key: env.TMDB_API_KEY,
      ...params
    });

    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`TMDB API error ${response.status}: ${await response.text()}`);
    }
    return await response.json();
  },

  async getNowPlayingMovies(page = 1) {
    return await this.fetchFromTmdb('/movie/now_playing', {
      region: 'IN',
      page: String(page)
    });
  },

  async getUpcomingMovies(page = 1) {
    return await this.fetchFromTmdb('/movie/upcoming', {
      region: 'IN',
      page: String(page)
    });
  },

  async getMovieDetails(movieId) {
    const details = await this.fetchFromTmdb(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,release_dates'
    });

    // Extract certification for India or US
    let certificate = 'UA';
    const releaseDates = details.release_dates?.results || [];
    const inRelease = releaseDates.find((r) => r.iso_3166_1 === 'IN');
    if (inRelease && inRelease.release_dates && inRelease.release_dates[0]?.certification) {
      certificate = inRelease.release_dates[0].certification;
    } else {
      const usRelease = releaseDates.find((r) => r.iso_3166_1 === 'US');
      if (usRelease && usRelease.release_dates && usRelease.release_dates[0]?.certification) {
        certificate = usRelease.release_dates[0].certification;
      }
    }

    // Extract YouTube trailer key
    let trailerKey = null;
    const videos = details.videos?.results || [];
    const trailer = videos.find(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    ) || videos[0];
    if (trailer) {
      trailerKey = trailer.key;
    }

    // Extract cast
    const cast = (details.credits?.cast || []).slice(0, 10).map((actor) => ({
      name: actor.name,
      character: actor.character,
      profile_url: actor.profile_path ? `${TMDB_IMAGE_BASE}/w185${actor.profile_path}` : null
    }));

    return {
      tmdb_id: details.id,
      title: details.title,
      overview: details.overview,
      language: details.original_language ? details.original_language.toUpperCase() : 'English',
      genres: (details.genres || []).map((g) => g.name),
      duration_minutes: details.runtime || 120,
      release_date: details.release_date,
      certificate,
      poster_url: details.poster_path ? `${TMDB_IMAGE_BASE}/w500${details.poster_path}` : null,
      backdrop_url: details.backdrop_path ? `${TMDB_IMAGE_BASE}/original${details.backdrop_path}` : null,
      trailer_key: trailerKey,
      rating: details.vote_average ? parseFloat(details.vote_average.toFixed(1)) : null,
      cast
    };
  }
};
