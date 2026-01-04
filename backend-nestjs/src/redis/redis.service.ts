import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis | null = null;
  private logger = new Logger(RedisService.name);

  constructor(private cfg: ConfigService) {
    const url = this.cfg.get<string>('REDIS_URL');
    if (url) {
      this.client = new Redis(url, { lazyConnect: true });
      this.client.on('error', (e) =>
        this.logger.warn(`Redis error: ${e.message}`),
      );
      this.client
        .connect()
        .catch(() =>
          this.logger.warn('Redis connect failed, fallback to memory'),
        );
    } else {
      this.logger.log('REDIS_URL not set, cache disabled');
    }
  }

  async getJSON<T = any>(key: string): Promise<T | null> {
    if (!this.client) return null;
    const s = await this.client.get(key);
    return s ? (JSON.parse(s) as T) : null;
  }
  async setJSON(key: string, value: any, ttlSec: number) {
    if (!this.client) return;
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSec);
  }
}
