class VideoCacheService {
  private cache: Map<string, string> = new Map();

  preloadVideo(key: string, url: string): void {
    if (!this.cache.has(key)) {
      this.cache.set(key, url);
    }
  }

  getVideo(key: string): string | undefined {
    return this.cache.get(key);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const videoCacheService = new VideoCacheService();
