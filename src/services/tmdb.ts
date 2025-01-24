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
  genres?: Genre[];
}

export interface Genre {
  id: number;
  name: string;
}

interface MovieFilters {
  query?: string;
  genres?: number[];
  minRating?: number;
}

class TMDBService {
  private apiKey: string;
  private baseUrl: string;
  private axiosInstance;
  private cachedMovies: Map<number, Movie>;
  private cachedGenres: Genre[] | null = null;

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

  async getGenres(): Promise<Genre[]> {
    try {
      if (this.cachedGenres) {
        return this.cachedGenres;
      }

      const response = await this.axiosInstance.get('/genre/movie/list');
      this.cachedGenres = response.data.genres;
      return this.cachedGenres;
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
  }

  private async getMovieDetails(movieId: number): Promise<Movie> {
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
          video_key: null
        }));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }

  async searchMovies(filters: MovieFilters): Promise<Movie[]> {
    try {
      let endpoint = filters.query ? '/search/movie' : '/trending/movie/day';
      let params: any = {};

      if (filters.query) {
        params.query = filters.query;
      }

      if (filters.genres && filters.genres.length > 0) {
        params.with_genres = filters.genres.join(',');
      }

      if (filters.minRating) {
        params['vote_average.gte'] = filters.minRating * 2; // Converting 5-star to 10-point scale
      }

      const response = await this.axiosInstance.get(endpoint, { params });
      const seenMovies = storageService.getSeenMovies();
      
      return response.data.results
        .filter((movie: any) => !seenMovies.includes(movie.id))
        .map((movie: any) => ({
          ...movie,
          liked: storageService.isMovieLiked(movie.id),
          video_key: null
        }));
    } catch (error) {
      console.error('Error searching movies:', error);
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
          video_key: null
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

  async getMoviesWithTrailers(filters: MovieFilters = {}): Promise<Movie[]> {
    try {
      console.log('Getting movies with trailers...');
      
      let movies: Movie[] = [];
      
      // Если есть фильтры, используем поиск
      if (filters.query || filters.genres?.length || filters.minRating) {
        movies = await this.searchMovies(filters);
      } else {
        // Если нет фильтров, используем рекомендации и трендовые фильмы
        const likedMovies = storageService.getLikedMovies();
        
        if (likedMovies.length > 0) {
          console.log('Found liked movies, getting recommendations...');
          const randomLikedMovie = likedMovies[Math.floor(Math.random() * likedMovies.length)];
          const recommendations = await this.getRecommendationsBasedOnMovie(randomLikedMovie.id);
          movies = recommendations;
        }
        
        if (movies.length < 10) {
          console.log('Getting additional trending movies...');
          const trendingMovies = await this.getTrendingMovies();
          movies = [...movies, ...trendingMovies];
        }
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
    this.cachedGenres = null;
    console.log('Cache cleared');
  }

  clearSeenMovies(): void {
    storageService.clearSeenMovies();
    this.clearCache();
  }
}

export const tmdbService = new TMDBService();
