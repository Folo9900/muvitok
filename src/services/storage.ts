import { Movie } from './tmdb';

interface StoredMovie {
  id: number;
  title: string;
  timestamp: number;
}

class StorageService {
  private readonly LIKED_MOVIES_KEY = 'muvitok_liked_movies';
  private readonly SEEN_MOVIES_KEY = 'muvitok_seen_movies';
  private readonly SOUND_STATE_KEY = 'muvitok_sound_state';

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage() {
    try {
      // Проверяем доступность localStorage
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      
      // Инициализируем хранилище, если оно пустое
      if (!this.getItem(this.LIKED_MOVIES_KEY)) {
        this.setItem(this.LIKED_MOVIES_KEY, []);
      }
      if (!this.getItem(this.SEEN_MOVIES_KEY)) {
        this.setItem(this.SEEN_MOVIES_KEY, []);
      }
      if (this.getItem(this.SOUND_STATE_KEY) === null) {
        this.setItem(this.SOUND_STATE_KEY, true); // По умолчанию звук включен
      }
      
      console.log('Storage initialized successfully');
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
      console.log(`Added movie to seen: ${movieId}`);
    }
  }

  clearSeenMovies(): void {
    this.setItem(this.SEEN_MOVIES_KEY, []);
    console.log('Cleared seen movies history');
  }

  // Управление состоянием звука
  getSoundState(): boolean {
    return this.getItem<boolean>(this.SOUND_STATE_KEY) ?? true;
  }

  setSoundState(isMuted: boolean): void {
    this.setItem(this.SOUND_STATE_KEY, isMuted);
    console.log(`Sound state changed: ${isMuted ? 'muted' : 'unmuted'}`);
  }
}

export const storageService = new StorageService();
