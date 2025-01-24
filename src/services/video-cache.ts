class VideoCacheService {
  private cache: Map<string, string>;
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
    console.log('VideoCacheService initialized with max size:', maxSize);
  }

  set(key: string | null | undefined, value: string | null | undefined): void {
    if (!key || !value) {
      console.warn('Attempted to cache invalid video URL');
      return;
    }

    if (this.cache.size >= this.maxSize) {
      const firstKey = Array.from(this.cache.keys())[0];
      if (firstKey) {
        this.cache.delete(firstKey);
        console.log('Cache full, removed oldest entry');
      }
    }

    this.cache.set(key, value);
    console.log(`Cached video URL for key: ${key}`);
  }

  get(key: string | null | undefined): string | undefined {
    if (!key) {
      console.warn('Attempted to get video URL with invalid key');
      return undefined;
    }
    return this.cache.get(key);
  }

  has(key: string | null | undefined): boolean {
    if (!key) return false;
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
