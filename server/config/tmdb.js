import { env } from './env.js';

export const tmdbConfig = {
  apiKey: env.TMDB_API_KEY,
  baseUrl: 'https://api.themoviedb.org/3',
  imageBaseUrl: 'https://image.tmdb.org/t/p'
};
