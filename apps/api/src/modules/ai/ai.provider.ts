import { ServiceUnavailableException, type Provider } from '@nestjs/common';
import { type EmbeddingModel, type LanguageModel } from 'ai';
import { ENV_CONFIG, type EnvConfig } from '@/config/env.config';

/** Token de inyeccion de los modelos del Vercel AI SDK. */
export const AI_MODELS = Symbol('AI_MODELS');

/**
 * Acceso perezoso a los modelos.
 *
 * Los metodos son asincronicos porque el SDK se importa dinamicamente. Hay dos
 * razones: la app tiene que poder levantar sin API key -sin IA funciona todo lo
 * demas- y el paquete `ai` se publica solo como ESM, asi que cargarlo de forma
 * estatica obligaria a todo consumidor CommonJS, tests incluidos, a resolverlo
 * aunque no lo use.
 */
export interface AiModels {
  language(): Promise<LanguageModel>;
  embedding(): Promise<EmbeddingModel>;
}

function requireApiKey(config: EnvConfig): string {
  const apiKey =
    config.AI_PROVIDER === 'google' ? config.GOOGLE_GENERATIVE_AI_API_KEY : config.OPENAI_API_KEY;

  if (!apiKey) {
    const variable =
      config.AI_PROVIDER === 'google' ? 'GOOGLE_GENERATIVE_AI_API_KEY' : 'OPENAI_API_KEY';

    throw new ServiceUnavailableException({
      code: 'INTERNAL_ERROR',
      message: `El modulo de IA necesita ${variable} en el archivo .env`,
    });
  }

  return apiKey;
}

function createModels(config: EnvConfig): AiModels {
  let language: LanguageModel | undefined;
  let embedding: EmbeddingModel | undefined;

  return {
    language: async () => {
      if (!language) {
        const apiKey = requireApiKey(config);

        if (config.AI_PROVIDER === 'google') {
          const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
          language = createGoogleGenerativeAI({ apiKey })(config.AI_MODEL);
        } else {
          const { createOpenAI } = await import('@ai-sdk/openai');
          language = createOpenAI({ apiKey })(config.AI_MODEL);
        }
      }

      return language;
    },

    embedding: async () => {
      if (!embedding) {
        const apiKey = requireApiKey(config);

        if (config.AI_PROVIDER === 'google') {
          const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
          embedding = createGoogleGenerativeAI({ apiKey }).textEmbeddingModel(
            config.AI_EMBEDDING_MODEL,
          );
        } else {
          const { createOpenAI } = await import('@ai-sdk/openai');
          embedding = createOpenAI({ apiKey }).textEmbeddingModel(config.AI_EMBEDDING_MODEL);
        }
      }

      return embedding;
    },
  };
}

export const aiModelsProvider: Provider = {
  provide: AI_MODELS,
  inject: [ENV_CONFIG],
  useFactory: (config: EnvConfig): AiModels => createModels(config),
};
