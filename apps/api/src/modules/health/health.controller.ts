import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { Public } from '@/common/decorators';
import { ApiZodResponse } from '@/common/swagger';
import { HealthService, type HealthReport } from './health.service';

const healthReportSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  database: z.enum(['up', 'down']),
  uptimeSeconds: z.number().int().nonnegative(),
  timestamp: z.iso.datetime(),
});

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Estado de la API y de sus dependencias' })
  @ApiZodResponse(HttpStatus.OK, healthReportSchema, 'Reporte de estado')
  check(): Promise<HealthReport> {
    return this.healthService.check();
  }
}
