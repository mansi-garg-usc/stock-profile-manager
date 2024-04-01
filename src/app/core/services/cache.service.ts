import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private cache = new Map<string, any>();

  constructor() {}

  setCache(key: string, data: any): void {
    this.cache.set(key, data);
  }

  getCache(key: string): any {
    return this.cache.get(key);
  }

  clearCache(key: string): void {
    this.cache.delete(key);
  }

  clearAllCache(): void {
    this.cache.clear();
  }
}
