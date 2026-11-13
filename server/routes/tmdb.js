import { Router } from 'express';
import { tmdbService } from '../services/tmdbService.js';

const router = Router();

// GET /api/tmdb/movie/:id
router.get('/movie/:id', async (req, res, next) => {
  try {
    const movieData = await tmdbService.getMovieDetails(req.params.id);
    res.status(200).json(movieData);
  } catch (error) {
    next(error);
  }
});

export default router;
