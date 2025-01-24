class VideoCacheService {
  private cache: Map<string, string>;
  private readonly MAX_CACHE_SIZE = 50;

  constructor() {
    this.cache = new Map();
    console.log('VideoCacheService initialized');
  }

  set(videoId: string, url: string): void {
    // Если кэш переполнен, удаляем самый старый элемент
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(videoId, url);
    console.log(`Cached video URL for ID: ${videoId}`);
  }

  get(videoId: string): string | undefined {
    const url = this.cache.get(videoId);
    if (url) {
      console.log(`Using cached video URL for ID: ${videoId}`);
    }
    return url;
  }

  clear(): void {
    this.cache.clear();
    console.log('Video cache cleared');
  }
}

export const videoCacheService = new VideoCacheService();
