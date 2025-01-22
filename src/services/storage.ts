import { Movie } from './tmdb';

class StorageService {
  private readonly LIKED_MOVIES_KEY = 'liked_movies';

  constructor() {
    // Инициализируем хранилище при создании сервиса
    if (!this.getLikedMovies()) {
      this.setLikedMovies([]);
    }
  }

  getLikedMovies(): number[] {
    try {
      const data = localStorage.getItem(this.LIKED_MOVIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading liked movies from storage:', error);
      return [];
    }
  }

  setLikedMovies(movieIds: number[]): void {
    try {
      localStorage.setItem(this.LIKED_MOVIES_KEY, JSON.stringify(movieIds));
    } catch (error) {
      console.error('Error saving liked movies to storage:', error);
    }
  }

  toggleLikedMovie(movieId: number): boolean {
    const likedMovies = this.getLikedMovies();
    const isLiked = likedMovies.includes(movieId);
    
    if (isLiked) {
      this.setLikedMovies(likedMovies.filter(id => id !== movieId));
    } else {
      this.setLikedMovies([...likedMovies, movieId]);
    }
    
    return !isLiked;
  }

  isMovieLiked(movieId: number): boolean {
    return this.getLikedMovies().includes(movieId);
  }
}

export const storageService = new StorageService();
