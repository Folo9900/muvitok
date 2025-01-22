import { Movie } from './tmdb';

interface StoredMovie {
  id: number;
  title: string;
  timestamp: number;
}

class StorageService {
  private readonly LIKED_MOVIES_KEY = 'muvitok_liked_movies';
  private readonly SEEN_MOVIES_KEY = 'muvitok_seen_movies';

  constructor() {
    // Проверяем доступность localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      console.log('LocalStorage is available');
    } catch (e) {
      console.error('LocalStorage is not available:', e);
    }
  }

  private getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Error reading from localStorage (${key}):`, e);
      return null;
    }
  }

  private setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing to localStorage (${key}):`, e);
    }
  }

  getLikedMovies(): StoredMovie[] {
    return this.getItem<StoredMovie[]>(this.LIKED_MOVIES_KEY) || [];
  }

  getLikedMovieIds(): number[] {
    return this.getLikedMovies().map(movie => movie.id);
  }

  addToLikedMovies(movie: Movie): void {
    const likedMovies = this.getLikedMovies();
    if (!likedMovies.some(m => m.id === movie.id)) {
      likedMovies.push({
        id: movie.id,
        title: movie.title,
        timestamp: Date.now()
      });
      this.setItem(this.LIKED_MOVIES_KEY, likedMovies);
      console.log(`Added movie to favorites: ${movie.title}`);
    }
  }

  removeFromLikedMovies(movieId: number): void {
    const likedMovies = this.getLikedMovies();
    const filteredMovies = likedMovies.filter(movie => movie.id !== movieId);
    if (filteredMovies.length !== likedMovies.length) {
      this.setItem(this.LIKED_MOVIES_KEY, filteredMovies);
      console.log(`Removed movie from favorites: ${movieId}`);
    }
  }

  toggleLikedMovie(movie: Movie): boolean {
    const isLiked = this.isMovieLiked(movie.id);
    if (isLiked) {
      this.removeFromLikedMovies(movie.id);
    } else {
      this.addToLikedMovies(movie);
    }
    return !isLiked;
  }

  isMovieLiked(movieId: number): boolean {
    return this.getLikedMovieIds().includes(movieId);
  }

  // Управление просмотренными фильмами
  getSeenMovies(): number[] {
    return this.getItem<number[]>(this.SEEN_MOVIES_KEY) || [];
  }

  addToSeenMovies(movieId: number): void {
    const seenMovies = this.getSeenMovies();
    if (!seenMovies.includes(movieId)) {
      seenMovies.push(movieId);
      this.setItem(this.SEEN_MOVIES_KEY, seenMovies);
    }
  }

  clearSeenMovies(): void {
    this.setItem(this.SEEN_MOVIES_KEY, []);
  }
}

export const storageService = new StorageService();
