import axios from 'axios';

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
  private axiosInstance;

  constructor() {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
    if (!apiKey) {
      console.error('TMDB API key not found in environment variables');
      throw new Error('TMDB API key not found. Please set VITE_TMDB_API_KEY environment variable.');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.themoviedb.org/3';
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        api_key: this.apiKey,
        language: 'ru-RU'
      }
    });
    
    console.log('TMDBService initialized successfully');
  }

  private async handleApiError(error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.status_message || error.message;
        
        if (status === 401) {
          console.error('Invalid TMDB API key. Check your environment variables.');
          throw new Error('Invalid TMDB API key. Please check your environment variables.');
        }
        
        console.error(`TMDB API Error (${status}):`, message);
        throw new Error(`TMDB API Error: ${status} - ${message}`);
      } else if (error.request) {
        console.error('Network Error: No response received');
        throw new Error('Network Error: Unable to reach TMDB API');
      }
    }
    console.error('Unexpected Error:', error.message);
    throw error;
  }

  async getTrendingMovies(): Promise<Movie[]> {
    try {
      console.log('Fetching trending movies...');
      const response = await this.axiosInstance.get('/trending/movie/day');
      console.log('Successfully fetched trending movies');
      return response.data.results;
    } catch (error) {
      return await this.handleApiError(error);
    }
  }

  async getMovieTrailer(movieId: number): Promise<string | null> {
    try {
      console.log(`Fetching trailer for movie ${movieId}...`);
      const response = await this.axiosInstance.get(`/movie/${movieId}/videos`);
      const videos = response.data.results;
      const trailer = videos.find((video: any) => 
        video.type === 'Trailer' && video.site === 'YouTube'
      );
      console.log(`Trailer ${trailer ? 'found' : 'not found'} for movie ${movieId}`);
      return trailer ? trailer.key : null;
    } catch (error) {
      console.error('Error fetching movie trailer:', error);
      return null;
    }
  }

  async getMovieRecommendations(movieId: number): Promise<Movie[]> {
    try {
      const response = await this.axiosInstance.get(`/movie/${movieId}/recommendations`);
      return response.data.results;
    } catch (error) {
      await this.handleApiError(error);
      return [];
    }
  }

  getImageUrl(path: string, size: 'w500' | 'original' = 'w500'): string {
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  async searchMovies(query: string): Promise<Movie[]> {
    try {
      const response = await this.axiosInstance.get('/search/movie', {
        params: {
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
      const response = await this.axiosInstance.get(`/movie/${movieId}`);
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
      console.log('Getting movies with trailers...');
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
      console.log(`Successfully processed ${moviesWithTrailers.length} movies with trailers`);
      return moviesWithTrailers;
    } catch (error) {
      console.error('Error in getMoviesWithTrailers:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch movies with trailers');
    }
  }
}

export const tmdbService = new TMDBService();
