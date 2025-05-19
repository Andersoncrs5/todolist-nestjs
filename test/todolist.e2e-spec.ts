import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { TodolistController } from '../src/todolist/todolist.controller';
import { TodolistService } from '../src/todolist/todolist.service';
import { Todo } from '../src/todolist/entities/todolist.entity';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import {
  addTransactionalDataSource,
  initializeTransactionalContext,
} from 'typeorm-transactional';
import { CreateTodolistDto } from 'src/todolist/dto/create-todolist.dto';

describe('TodolistController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Inicializa o contexto transacional ANTES de tudo
    initializeTransactionalContext();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'sqlite',
            database: ':memory:',
            dropSchema: true,
            entities: [Todo],
            synchronize: true,
          }),
          async dataSourceFactory(options) {
            if (!options) throw new Error('Invalid options passed');
            return addTransactionalDataSource(new DataSource(options));
          },
        }),
        TypeOrmModule.forFeature([Todo]),
      ],
      controllers: [TodolistController],
      providers: [TodolistService],
    }).compile();

    app = moduleRef.createNestApplication();

    // Boas práticas: validação global
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    dataSource = moduleRef.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/todolist (POST) should create a new task', async () => {
    const dto: CreateTodolistDto = {
      title: 'Nova tarefa E2E',
      description: 'Teste completo de criação',
      completed: false,
    };

    const response = await request(app.getHttpServer())
      .post('/todolist')
      .send(dto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe(dto.title);
    expect(response.body.description).toBe(dto.description);
    expect(response.body.completed).toBe(dto.completed);
  });

  it('/GET should get a task ', async ()=> {
    const dto: CreateTodolistDto = {
      title: 'Nova tarefa E2E',
      description: 'Teste completo de criação',
      completed: false,
    };

    const response = await request(app.getHttpServer())
        .post('/todolist')
        .send(dto)
        .expect(201);

    expect(response.body).toHaveProperty('id');

    const id = response.body.id

    const responseGet = await request(app.getHttpServer())
        .get('/todolist/'+id)
        .expect(200);

    expect(responseGet.body).toHaveProperty('id', id);
    expect(responseGet.body.title).toBe(dto.title)
    expect(responseGet.body.description).toBe(dto.description)

  });

  it('/DELETE should delete a task ', async ()=> {
    const dto: CreateTodolistDto = {
      title: 'Nova tarefa E2E',
      description: 'Teste completo de criação',
      completed: false,
    };

    const response = await request(app.getHttpServer())
        .post('/todolist')
        .send(dto)
        .expect(201);

    expect(response.body).toHaveProperty('id');

    const id = response.body.id

    const responseGet = await request(app.getHttpServer())
        .get('/todolist/'+id)
        .expect(200);

    expect(responseGet.body).toHaveProperty('id', id);
    expect(responseGet.body.title).toBe(dto.title)
    expect(responseGet.body.description).toBe(dto.description)

    await request(app.getHttpServer())
        .delete('/todolist/'+id)
        .expect(200);
  });

  it('/PUT should update a task ', async ()=> {
    const dto: CreateTodolistDto = {
      title: 'Nova tarefa E2E',
      description: 'Teste completo de criação',
      completed: false,
    };

    const response = await request(app.getHttpServer())
        .post('/todolist')
        .send(dto)
        .expect(201);

    expect(response.body).toHaveProperty('id');

    const id = response.body.id

    const responseGet = await request(app.getHttpServer())
        .get('/todolist/'+id)
        .expect(200);

    expect(responseGet.body).toHaveProperty('id', id);
    expect(responseGet.body.title).toBe(dto.title)
    expect(responseGet.body.description).toBe(dto.description)

    const updateDto: CreateTodolistDto = {
      title: 'Nova tarefa E2E update',
      description: 'Teste completo de criação update',
      completed: false,
    };

    await request(app.getHttpServer())
        .put('/todolist/'+id)
        .send(updateDto)
        .expect(200);

    const responseGetAfterUpdate = await request(app.getHttpServer())
        .get('/todolist/'+id)
        .expect(200);

    expect(responseGetAfterUpdate.body).toHaveProperty('id', id);
    expect(responseGetAfterUpdate.body.title).toBe(updateDto.title)
    expect(responseGetAfterUpdate.body.description).toBe(updateDto.description)
    expect(responseGetAfterUpdate.body.completed).toBe(updateDto.completed)

  });

  it('/changeStatusTaskAsync should change Status a task ', async ()=> {
    const dto: CreateTodolistDto = {
      title: 'Nova tarefa E2E',
      description: 'Teste completo de criação',
      completed: false,
    };

    const response = await request(app.getHttpServer())
        .post('/todolist')
        .send(dto)
        .expect(201);

    expect(response.body).toHaveProperty('id');

    const id = response.body.id

    const responseGet = await request(app.getHttpServer())
        .get('/todolist/'+id)
        .expect(200);

    expect(responseGet.body).toHaveProperty('id', id);
    expect(responseGet.body.title).toBe(dto.title)
    expect(responseGet.body.description).toBe(dto.description)

    await request(app.getHttpServer()) 
        .get('/todolist/changeStatusTaskAsync/'+id)
        .expect(200);
    
    const responseGetAfterUpdate = await request(app.getHttpServer())
        .get('/todolist/'+id)
        .expect(200);

    expect(responseGetAfterUpdate.body).toHaveProperty('id', id);
    expect(responseGetAfterUpdate.body.title).toBe(dto.title)
    expect(responseGetAfterUpdate.body.description).toBe(dto.description)
    expect(responseGetAfterUpdate.body.completed).toBe(!dto.completed)

  });

});
