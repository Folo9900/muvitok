import axios from 'axios';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  vote_average: number;
  poster_path: string;
  backdrop_path: string;
  video_key: string | null;
  liked: boolean;
}

class TMDBService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
    if (!apiKey) {
      throw new Error('TMDB API key not found. Please set VITE_TMDB_API_KEY environment variable.');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.themoviedb.org/3';
  }

  private async handleApiError(error: any) {
    if (error.response) {
      if (error.response.status === 401) {
        console.error('Invalid TMDB API key. Please check your environment variables.');
      }
      throw new Error(`TMDB API Error: ${error.response.status} - ${error.response.data.status_message || error.message}`);
    }
    throw error;
  }

  async getTrendingMovies(): Promise<Movie[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/trending/movie/day`, {
        params: {
          api_key: this.apiKey,
          language: 'ru-RU'
        }
      });
      return response.data.results;
    } catch (error) {
      await this.handleApiError(error);
      return [];
    }
  }

  async getMovieTrailer(movieId: number): Promise<string | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/movie/${movieId}/videos`, {
        params: {
          api_key: this.apiKey
        }
      });
      const videos = response.data.results;
      const trailer = videos.find((video: any) => 
        video.type === 'Trailer' && video.site === 'YouTube'
      );
      return trailer ? trailer.key : null;
    } catch (error) {
      await this.handleApiError(error);
      return null;
    }
  }

  async getMovieRecommendations(movieId: number): Promise<Movie[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/movie/${movieId}/recommendations`, {
        params: {
          api_key: this.apiKey
        }
      });
      return response.data.results;
    } catch (error) {
      await this.handleApiError(error);
      return [];
    }
  }

  getImageUrl(path: string, size: 'w500' | 'original' = 'w500'): string {
    return `${IMAGE_BASE_URL}/${size}${path}`;
  }

  async searchMovies(query: string): Promise<Movie[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/search/movie`, {
        params: {
          api_key: this.apiKey,
          query
        }
      });
      return response.data.results;
    } catch (error) {
      await this.handleApiError(error);
      return [];
    }
  }

  async getMovieDetails(movieId: number): Promise<Movie> {
    try {
      const response = await axios.get(`${this.baseUrl}/movie/${movieId}`, {
        params: {
          api_key: this.apiKey
        }
      });
      const trailerKey = await this.getMovieTrailer(movieId);
      return {
        ...response.data,
        video_key: trailerKey,
        liked: false
      };
    } catch (error) {
      await this.handleApiError(error);
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
          } as Movie;
        })
      );
      return moviesWithTrailers;
    } catch (error) {
      await this.handleApiError(error);
      return [];
    }
  }
}

export const tmdbService = new TMDBService();
