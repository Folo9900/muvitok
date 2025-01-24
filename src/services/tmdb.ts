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
  private cachedMovies: Map<number, Movie>;

  constructor() {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
    if (!apiKey) {
      console.error('TMDB API key not found in environment variables');
      throw new Error('TMDB API key not found. Please set VITE_TMDB_API_KEY environment variable.');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.themoviedb.org/3';
    this.cachedMovies = new Map();
    
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

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
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
      }
    }
    console.error('Unexpected Error:', error.message);
    throw error;
  }

  private async getMovieDetails(movieId: number): Promise<Movie> {
    // Проверяем кэш
    const cachedMovie = this.cachedMovies.get(movieId);
    if (cachedMovie) {
      console.log(`Using cached movie details for ID: ${movieId}`);
      return {
        ...cachedMovie,
        liked: storageService.isMovieLiked(movieId)
      };
    }

    try {
      console.log(`Fetching movie details for ID: ${movieId}`);
      const response = await this.axiosInstance.get(`/movie/${movieId}`);
      const trailerKey = await this.getMovieTrailer(movieId);
      
      const movie = {
        ...response.data,
        video_key: trailerKey,
        liked: storageService.isMovieLiked(movieId)
      };

      // Сохраняем в кэш
      this.cachedMovies.set(movieId, movie);
      
      return movie;
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  }

  private async getRecommendationsBasedOnMovie(movieId: number): Promise<Movie[]> {
    try {
      console.log(`Fetching recommendations for movie ID: ${movieId}`);
      const response = await this.axiosInstance.get(`/movie/${movieId}/recommendations`);
      const seenMovies = storageService.getSeenMovies();
      
      return response.data.results
        .filter((movie: any) => !seenMovies.includes(movie.id))
        .map((movie: any) => ({
          ...movie,
          liked: storageService.isMovieLiked(movie.id),
          video_key: null // будет загружено позже
        }));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }

  async getTrendingMovies(): Promise<Movie[]> {
    try {
      console.log('Fetching trending movies...');
      const response = await this.axiosInstance.get('/trending/movie/day');
      const seenMovies = storageService.getSeenMovies();
      
      const movies = response.data.results
        .filter((movie: any) => !seenMovies.includes(movie.id))
        .map((movie: any) => ({
          ...movie,
          liked: storageService.isMovieLiked(movie.id),
          video_key: null // будет загружено позже
        }));

      console.log(`Successfully fetched ${movies.length} trending movies`);
      return this.shuffleArray(movies);
    } catch (error) {
      return await this.handleApiError(error);
    }
  }

  async getMovieTrailer(movieId: number): Promise<string | null> {
    try {
      console.log(`Fetching trailer for movie ${movieId}...`);
      const response = await this.axiosInstance.get(`/movie/${movieId}/videos`);
      const videos = response.data.results;
      
      // Ищем сначала русский трейлер
      let trailer = videos.find((video: any) => 
        video.type === 'Trailer' && 
        video.site === 'YouTube' &&
        video.iso_639_1 === 'ru'
      );

      // Если русского нет, берем любой
      if (!trailer) {
        trailer = videos.find((video: any) => 
          video.type === 'Trailer' && 
          video.site === 'YouTube'
        );
      }

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
      let movies: Movie[] = [];
      
      // Если есть избранные фильмы, получаем рекомендации на их основе
      if (likedMovies.length > 0) {
        console.log('Found liked movies, getting recommendations...');
        const randomLikedMovie = likedMovies[Math.floor(Math.random() * likedMovies.length)];
        const recommendations = await this.getRecommendationsBasedOnMovie(randomLikedMovie.id);
        movies = recommendations;
      }
      
      // Если рекомендаций нет или их мало, добавляем трендовые фильмы
      if (movies.length < 10) {
        console.log('Getting additional trending movies...');
        const trendingMovies = await this.getTrendingMovies();
        movies = [...movies, ...trendingMovies];
      }

      // Перемешиваем фильмы и берем только первые 20
      const shuffledMovies = this.shuffleArray(movies).slice(0, 20);
      
      // Получаем полную информацию о каждом фильме
      console.log('Fetching full details for movies...');
      const moviesWithDetails = await Promise.all(
        shuffledMovies.map(async (movie) => {
          try {
            const details = await this.getMovieDetails(movie.id);
            storageService.addToSeenMovies(movie.id);
            return details;
          } catch (error) {
            console.error(`Error fetching details for movie ${movie.id}:`, error);
            return movie;
          }
        })
      );

      console.log(`Successfully processed ${moviesWithDetails.length} movies with trailers`);
      return moviesWithDetails;
    } catch (error) {
      console.error('Error in getMoviesWithTrailers:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch movies with trailers');
    }
  }

  clearCache(): void {
    this.cachedMovies.clear();
    console.log('Movie cache cleared');
  }

  // Метод для очистки истории просмотренных фильмов
  clearSeenMovies(): void {
    storageService.clearSeenMovies();
    this.clearCache();
  }
}

export const tmdbService = new TMDBService();
