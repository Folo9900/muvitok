import axios from 'axios';
import { storageService } from './storage';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  vote_average: number;
  poster_path: string;
  backdrop_path: string;
  video_key: string | null;
  liked: boolean;
  genres?: { id: number; name: string }[];
}

class TMDBService {
  private apiKey: string;
  private baseUrl: string;
  private axiosInstance;
  private seenMovies: Set<number>;

  constructor() {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
    if (!apiKey) {
      console.error('TMDB API key not found in environment variables');
      throw new Error('TMDB API key not found. Please set VITE_TMDB_API_KEY environment variable.');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.themoviedb.org/3';
    this.seenMovies = new Set();
    
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

  private async getMovieGenres(movieId: number): Promise<{ id: number; name: string }[]> {
    try {
      const response = await this.axiosInstance.get(`/movie/${movieId}`);
      return response.data.genres || [];
    } catch (error) {
      console.error('Error fetching movie genres:', error);
      return [];
    }
  }

  private async getRecommendationsBasedOnMovie(movieId: number): Promise<Movie[]> {
    try {
      const response = await this.axiosInstance.get(`/movie/${movieId}/recommendations`);
      return response.data.results.filter((movie: Movie) => !this.seenMovies.has(movie.id));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }

  async getTrendingMovies(): Promise<Movie[]> {
    try {
      console.log('Fetching trending movies...');
      const response = await this.axiosInstance.get('/trending/movie/day');
      const movies = response.data.results.filter((movie: Movie) => !this.seenMovies.has(movie.id));
      console.log('Successfully fetched trending movies');
      return movies;
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

  async getMoviesWithTrailers(): Promise<Movie[]> {
    try {
      console.log('Getting movies with trailers...');
      
      // Получаем избранные фильмы
      const likedMovies = storageService.getLikedMovies();
      let recommendedMovies: Movie[] = [];
      
      // Если есть избранные фильмы, получаем рекомендации на их основе
      if (likedMovies.length > 0) {
        const randomLikedMovie = likedMovies[Math.floor(Math.random() * likedMovies.length)];
        recommendedMovies = await this.getRecommendationsBasedOnMovie(randomLikedMovie);
      }
      
      // Если рекомендаций нет или их мало, добавляем трендовые фильмы
      if (recommendedMovies.length < 10) {
        const trendingMovies = await this.getTrendingMovies();
        recommendedMovies = [...recommendedMovies, ...trendingMovies];
      }

      // Перемешиваем фильмы
      const shuffledMovies = this.shuffleArray(recommendedMovies);
      
      // Получаем трейлеры и жанры для каждого фильма
      const moviesWithTrailers = await Promise.all(
        shuffledMovies.slice(0, 20).map(async (movie) => {
          const trailerKey = await this.getMovieTrailer(movie.id);
          const genres = await this.getMovieGenres(movie.id);
          this.seenMovies.add(movie.id);
          return {
            ...movie,
            video_key: trailerKey,
            genres,
            liked: likedMovies.includes(movie.id)
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

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}

export const tmdbService = new TMDBService();
