import 'reflect-metadata';
// Resuelve el alias `@/` en el codigo compilado. Tiene que ir antes que
// cualquier import aliaseado: tsc conserva el orden de los require.
import 'module-alias/register';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { bootstrapEnvConfig, parseCorsOrigins, type EnvConfig } from './config/env.config';

const GLOBAL_PREFIX = 'api';
const DOCS_PATH = 'api/docs';

function setupSwagger(app: Awaited<ReturnType<typeof NestFactory.create>>): void {
  const document = new DocumentBuilder()
    .setTitle('Calce API')
    .setDescription(
      'Gestion comercial para distribuidoras de autopartes. Todas las rutas ' +
        'estan protegidas salvo las marcadas como publicas.',
    )
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();

  SwaggerModule.setup(DOCS_PATH, app, SwaggerModule.createDocument(app, document));
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  // Se valida antes de construir la app para que un .env incompleto falle con
  // un mensaje legible y no con un stack trace de inyeccion de dependencias.
  let config: EnvConfig;
  try {
    config = bootstrapEnvConfig();
  } catch (error: unknown) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.enableCors({ origin: parseCorsOrigins(config), credentials: true });
  app.enableShutdownHooks();

  setupSwagger(app);

  await app.listen(config.PORT);

  logger.log(`API escuchando en http://localhost:${config.PORT}/${GLOBAL_PREFIX}`);
  logger.log(`Documentacion en http://localhost:${config.PORT}/${DOCS_PATH}`);
}

void bootstrap();
