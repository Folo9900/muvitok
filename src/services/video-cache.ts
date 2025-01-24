class VideoCacheService {
  private cache: Map<string, string>;
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
    console.log('VideoCacheService initialized with max size:', maxSize);
  }

  set(key: string, value: string): void {
    if (!key || !value) {
      console.warn('Attempted to cache invalid video URL');
      return;
    }

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      console.log('Cache full, removed oldest entry');
    }

    this.cache.set(key, value);
    console.log(`Cached video URL for key: ${key}`);
  }

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    console.log('Video cache cleared');
  }

  getSize(): number {
    return this.cache.size;
  }
}

export const videoCacheService = new VideoCacheService();
