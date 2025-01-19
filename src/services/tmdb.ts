import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  vote_average: number;
  poster_path: string;
  backdrop_path: string;
  video_key?: string;
}

class TMDBService {
  private api = axios.create({
    baseURL: BASE_URL,
    params: {
      api_key: TMDB_API_KEY,
      language: 'ru-RU',
    },
  });

  async getTrendingMovies(): Promise<Movie[]> {
    try {
      const response = await this.api.get('/trending/movie/day');
      return response.data.results;
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      throw error;
    }
  }

  async getMovieTrailer(movieId: number): Promise<string | null> {
    try {
      const response = await this.api.get(`/movie/${movieId}/videos`);
      const videos = response.data.results;
      const trailer = videos.find((video: any) => 
        video.type === 'Trailer' && video.site === 'YouTube'
      );
      return trailer ? trailer.key : null;
    } catch (error) {
      console.error('Error fetching movie trailer:', error);
      return null;
    }
  }

  async getMovieRecommendations(movieId: number): Promise<Movie[]> {
    try {
      const response = await this.api.get(`/movie/${movieId}/recommendations`);
      return response.data.results;
    } catch (error) {
      console.error('Error fetching movie recommendations:', error);
      throw error;
    }
  }

  getImageUrl(path: string, size: 'w500' | 'original' = 'w500'): string {
    return `${IMAGE_BASE_URL}/${size}${path}`;
  }

  async searchMovies(query: string): Promise<Movie[]> {
    try {
      const response = await this.api.get('/search/movie', {
        params: { query },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  }

  async getMovieDetails(movieId: number): Promise<Movie> {
    try {
      const response = await this.api.get(`/movie/${movieId}`);
      const trailerKey = await this.getMovieTrailer(movieId);
      return {
        ...response.data,
        video_key: trailerKey,
      };
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  }

  async getMoviesWithTrailers(): Promise<Movie[]> {
    try {
      const trendingMovies = await this.getTrendingMovies();
      const moviesWithTrailers = await Promise.all(
        trendingMovies.map(async (movie) => {
          const trailerKey = await this.getMovieTrailer(movie.id);
          return {
            ...movie,
            video_key: trailerKey,
            liked: false
          };
        })
      );
      return moviesWithTrailers;
    } catch (error) {
      console.error('Error getting movies with trailers:', error);
      throw error;
    }
  }
}

export const tmdbService = new TMDBService();
