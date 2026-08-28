import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/common/decorators';
import { ZodValidationPipe } from '@/common/pipes';
import { ApiZodBody, ApiZodErrorResponse, ApiZodResponse } from '@/common/swagger';
import { AiService } from './ai.service';
import {
  pingAiDtoSchema,
  pingAiResultSchema,
  type PingAiDto,
  type PingAiResult,
} from './dto/ping-ai.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ping')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica credenciales y conectividad con el proveedor de IA' })
  @ApiZodBody(pingAiDtoSchema)
  @ApiZodResponse(HttpStatus.OK, pingAiResultSchema, 'El proveedor respondio')
  @ApiZodErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, 'El proveedor de IA no respondio')
  ping(@Body(new ZodValidationPipe(pingAiDtoSchema)) dto: PingAiDto): Promise<PingAiResult> {
    return this.aiService.ping(dto);
  }
}
