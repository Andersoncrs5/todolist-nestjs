import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { TodolistController } from '../src/todolist/todolist.controller';
import { TodolistService } from '../src/todolist/todolist.service';
import { Todo } from '../src/todolist/entities/todolist.entity';
import { CreateTodolistDto } from '../src/todolist/dto/create-todolist.dto';

describe('TodolistController (e2e) - Validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [Todo],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Todo]),
      ],
      controllers: [TodolistController],
      providers: [TodolistService],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 400 if title is missing', async () => {
    const dto: Partial<CreateTodolistDto> = {
      description: 'Desc válida',
      completed: false
    };

    const res = await request(app.getHttpServer())
      .post('/todolist')
      .send(dto)
      .expect(400);

    expect(res.body.message).toContain('O título não pode estar vazio.');
  });

  it('should return 400 if description is too long', async () => {
    const dto: CreateTodolistDto = {
      title: 'Título válido',
      description: 'x'.repeat(600),
      completed: false,
    };

    const res = await request(app.getHttpServer())
      .post('/todolist')
      .send(dto)
      .expect(400);

    expect(res.body.message).toContain('A descrição não pode ter mais de 500 caracteres.');
  });

  it('should return 400 if completed is not a boolean', async () => {
    const dto = {
      title: 'Título válido',
      description: 'Descrição válida',
      completed: 'sim',
    };

    const res = await request(app.getHttpServer())
      .post('/todolist')
      .send(dto)
      .expect(400);

    expect(res.body.message).toContain('the completed should to be a boolean');
  });

  it('should return 400 if extra unexpected property is sent', async () => {
    const dto = {
      title: 'Título válido',
      description: 'Descrição válida',
      completed: false,
      extra: 'campo inválido'
    };

    const res = await request(app.getHttpServer())
      .post('/todolist')
      .send(dto)
      .expect(400);

    expect(res.body.message[0]).toContain('property extra should not exist');
  });
});
