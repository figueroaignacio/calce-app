import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ENV_CONFIG, type EnvConfig } from '@/config/env.config';
import { AI_MODELS, type AiModels } from './ai.provider';
import { type PingAiDto, type PingAiResult } from './dto/ping-ai.dto';

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_MODELS) private readonly models: AiModels,
    @Inject(ENV_CONFIG) private readonly config: EnvConfig,
  ) {}

  /**
   * Generacion trivial contra el proveedor configurado.
   *
   * Existe para verificar credenciales y conectividad de una, sin depender de
   * ninguna funcionalidad de negocio.
   */
  async ping(dto: PingAiDto): Promise<PingAiResult> {
    // Fuera del try: si falta la credencial, el error que corresponde es el que
    // nombra la variable de entorno, no un "el proveedor no respondio".
    const model = await this.models.language();

    // `ai` es ESM puro. Se importa recien aca para no atar el arranque de la
    // app -ni a los consumidores CommonJS- a la carga del SDK.
    const { generateText } = await import('ai');

    const startedAt = Date.now();

    try {
      const result = await generateText({ model, prompt: dto.prompt, maxOutputTokens: 64 });

      return {
        provider: this.config.AI_PROVIDER,
        model: this.config.AI_MODEL,
        text: result.text,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error: unknown) {
      throw new ServiceUnavailableException({
        code: 'INTERNAL_ERROR',
        message: `El proveedor de IA no respondio: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      });
    }
  }
}
