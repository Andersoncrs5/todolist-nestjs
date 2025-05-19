import { NestFactory } from '@nestjs/core'; 
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { initializeTransactionalContext } from 'typeorm-transactional';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { AllExceptionsFilter } from './utils/all-exceptions.filter';
import { RawServerDefault } from 'fastify';

async function bootstrap() {
  initializeTransactionalContext()

  const app: NestFastifyApplication<RawServerDefault> = await NestFactory.create(AppModule, new FastifyAdapter());

  app.useGlobalPipes(new ValidationPipe({
    transform: true,  
    whitelist: true,  
    forbidNonWhitelisted: true,  
    validationError: {
      target: false, 
      value: false,  
    },
  }));

  await app.register(cors, {
    origin: 'http://127.0.0.1:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalFilters(new AllExceptionsFilter()); 
  
  const options = new DocumentBuilder()
    .setTitle('Todolist API')
    .setDescription('A simple Nest.js API with Fastify')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(4000);
}
bootstrap();
