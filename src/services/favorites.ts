import { tmdbService } from './tmdb';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
}

// Временное хранилище для избранных фильмов (в реальном приложении это должно быть в базе данных)
let favoriteMovies: Movie[] = [];

export const favoritesService = {
  async getFavorites(): Promise<Movie[]> {
    return favoriteMovies;
  },

  async addToFavorites(movieId: number): Promise<void> {
    try {
      const movieDetails = await tmdbService.getMovieDetails(movieId);
      if (!favoriteMovies.some(m => m.id === movieId)) {
        favoriteMovies.push({
          id: movieId,
          title: movieDetails.title,
          poster_path: movieDetails.poster_path,
          vote_average: movieDetails.vote_average
        });
      }
    } catch (error) {
      console.error('Error adding movie to favorites:', error);
      throw error;
    }
  },

  async removeFromFavorites(movieId: number): Promise<void> {
    favoriteMovies = favoriteMovies.filter(movie => movie.id !== movieId);
  },

  async isFavorite(movieId: number): Promise<boolean> {
    return favoriteMovies.some(movie => movie.id === movieId);
  }
};
