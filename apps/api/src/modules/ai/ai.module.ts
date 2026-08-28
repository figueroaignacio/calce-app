import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { aiModelsProvider } from './ai.provider';
import { AiService } from './ai.service';

/**
 * Modulo de IA.
 *
 * Hoy solo expone `POST /ai/ping`. Los proveedores de modelo ya quedan
 * inyectables (token `AI_MODELS`) para que `EmbeddingsService` y
 * `SemanticSearchService` -los dos stubs de este directorio- se puedan escribir
 * sin tocar la configuracion.
 */
@Module({
  controllers: [AiController],
  providers: [AiService, aiModelsProvider],
  exports: [AiService],
})
export class AiModule {}
