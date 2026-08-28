import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { ENV_CONFIG, type EnvConfig } from '@/config/env.config';
import { DATABASE, DATABASE_CONNECTION } from '@/database/database.provider';

/**
 * Prueba de extremo a extremo del arranque HTTP.
 *
 * La base y el entorno se reemplazan por dobles para que el test no dependa de
 * una conexion real: lo que se verifica es que la app levante y que el sobre de
 * respuesta, el filtro de errores y el guard global esten enganchados.
 */
const testConfig: EnvConfig = Object.freeze({
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  NEON_WS_PROXY: undefined,
  PORT: 3000,
  NODE_ENV: 'test',
  CORS_ORIGIN: 'http://localhost:5173',
  JWT_SECRET: 'x'.repeat(32),
  JWT_EXPIRES_IN: '15m',
  REFRESH_TOKEN_SECRET: 'y'.repeat(32),
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  AI_PROVIDER: 'google',
  GOOGLE_GENERATIVE_AI_API_KEY: undefined,
  OPENAI_API_KEY: undefined,
  AI_MODEL: 'gemini-2.5-flash',
  AI_EMBEDDING_MODEL: 'text-embedding-004',
});

describe('Health (e2e)', () => {
  let app: INestApplication;
  const execute = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ENV_CONFIG)
      .useValue(testConfig)
      .overrideProvider(DATABASE)
      .useValue({ execute })
      .overrideProvider(DATABASE_CONNECTION)
      .useValue({ close: jest.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health devuelve ok con la base disponible', async () => {
    execute.mockResolvedValue([]);

    const response = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: { status: 'ok', database: 'up' },
    });
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('GET /api/health informa degraded cuando la base no responde', async () => {
    execute.mockRejectedValue(new Error('conexion rechazada'));

    const response = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(response.body.data).toMatchObject({ status: 'degraded', database: 'down' });
  });

  it('una ruta no publica exige token y responde con el formato de error unico', async () => {
    const response = await request(app.getHttpServer()).get('/api/products').expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED' },
      statusCode: 401,
      path: '/api/products',
    });
  });
});
