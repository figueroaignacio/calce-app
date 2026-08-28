import { type Database } from '@calce/db';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE } from '@/database/database.provider';

export type HealthStatus = 'ok' | 'degraded';
export type DependencyStatus = 'up' | 'down';

export interface HealthReport {
  status: HealthStatus;
  database: DependencyStatus;
  uptimeSeconds: number;
  timestamp: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Verifica que la base responda.
   *
   * No lanza: el health check tiene que contestar siempre, y decir que la base
   * esta caida es informacion util, no un error del endpoint.
   */
  async check(): Promise<HealthReport> {
    const database = await this.pingDatabase();

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  private async pingDatabase(): Promise<DependencyStatus> {
    try {
      await this.db.execute(sql`select 1`);
      return 'up';
    } catch (error: unknown) {
      this.logger.error(
        'La base de datos no responde',
        error instanceof Error ? error.stack : error,
      );
      return 'down';
    }
  }
}
