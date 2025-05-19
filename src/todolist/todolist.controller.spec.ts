import { Test, TestingModule } from '@nestjs/testing';
import { TodolistController } from './todolist.controller';
import { TodolistService } from './todolist.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from './entities/todolist.entity';
import { Repository, DataSource } from 'typeorm';
import { CreateTodolistDto } from './dto/create-todolist.dto';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { UpdateTodolistDto } from './dto/update-todolist.dto';

describe('TodolistController (integration)', () => {
  let app: INestApplication;
  let repository: Repository<Todo>;

  beforeAll(async () => {
    initializeTransactionalContext()
    
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory() { 
            return {
              type: 'sqlite',
              database: ':memory:',
              dropSchema: true,
              entities: [Todo],
              synchronize: true,
            }
          },
          async dataSourceFactory(options) {
            if (!options) { throw new Error('Invalid options passed') }

            return addTransactionalDataSource(new DataSource(options))
          }
        }),
        TypeOrmModule.forFeature([Todo]),
      ],
      controllers: [TodolistController],
      providers: [TodolistService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    repository = moduleRef.get(getRepositoryToken(Todo));
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST should create a task', async () => {
    const dto: CreateTodolistDto = {
      title: 'test of silva',
      description: 'descrption of test of silva',
      completed: false
    }

    const response = await request(app.getHttpServer())
      .post('/todolist')
      .send(dto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe(dto.title);
    expect(response.body.description).toBe(dto.description);
    expect(response.body.completed).toBe(dto.completed);

    const saved = await repository.findOne({ where: { id: response.body.id } });
    expect(saved).toBeDefined();
    expect(saved?.title).toBe(dto.title);
  });

  it('/GET  should get a task', async ()=> {
    const dto: CreateTodolistDto = {
      title: 'test of silva',
      description: 'descrption of test of silva',
      completed: false
    }

    const response = await request(app.getHttpServer())
      .post('/todolist')
      .send(dto)
      .expect(201)

    expect(response.body).toHaveProperty('id');

    const id = response.body.id;

    const responseGet = await request(app.getHttpServer())
      .get('/todolist/'+id)
      .expect(200);

    expect(responseGet.body).toHaveProperty('id', id);
    expect(responseGet.body).toHaveProperty('title', dto.title);
    expect(responseGet.body).toHaveProperty('description', dto.description);
  });

  it('/GET should throw badRequest with http 400', async () => {
    await request(app.getHttpServer())
      .get('/todolist/'+0)
      .expect(400);

    await request(app.getHttpServer())
      .get(`/todolist/${-1}`)
      .expect(400)

    await request(app.getHttpServer())
      .get(`/todolist/${NaN}`)
      .expect(400)
  });

  it('/GET should throw NotFound', async ()=> {
    await request(app.getHttpServer())
      .get('/todolist/'+9999999999999999)
      .expect(404);
  });

  it('/DELETE should delete a task', async ()=> {
    const dto: CreateTodolistDto = {
      title: 'test of silva',
      description: 'descrption of test of silva',
      completed: false
    }

    const response = await request(app.getHttpServer())
      .post('/todolist')
      .send(dto)
      .expect(201)

    expect(response.body).toHaveProperty('id')

    const id = response.body.id

    const responseGet = await request(app.getHttpServer())
      .get('/todolist/'+id)
      .expect(200);

    expect(responseGet.body).toHaveProperty('id', id)

    const responseDelete = await request(app.getHttpServer())
      .delete('/todolist/'+id)
      .expect(200)

  });

  it('/UPDATE should update a task ', async () => {
    const dto: CreateTodolistDto = {
      title: 'test of silva',
      description: 'descrption of test of silva',
      completed: false
    };

    const response = await request(app.getHttpServer())
      .post('/todolist')
      .send(dto)
      .expect(201);

    expect(response.body).toHaveProperty('id');

    const id = response.body.id;

    const responseGet = await request(app.getHttpServer())
      .get('/todolist/' + id)
      .expect(200);

    expect(responseGet.body).toHaveProperty('id', id);

    const updateDto: UpdateTodolistDto = {
      title: 'test of silva update',
      description: 'descrption of test of silva update',
      completed: true
    };

    const responsePut = await request(app.getHttpServer())
      .put('/todolist/' + id)
      .send(updateDto)
      .expect(200);

    const responseGetAflterChange = await request(app.getHttpServer())
      .get('/todolist/' + id)
      .expect(200);

    expect(responseGetAflterChange.body).toHaveProperty('id', id);
    expect(responseGetAflterChange.body).toHaveProperty('title', updateDto.title);
    expect(responseGetAflterChange.body).toHaveProperty('description', updateDto.description);
    expect(responseGetAflterChange.body).toHaveProperty('completed', updateDto.completed);
  });

  it('/CHANGESTATUSTASK should change status of task ', async ()=> {
    const dto: CreateTodolistDto = {
      title: 'test of silva',
      description: 'descrption of test of silva',
      completed: false
    };

    const response = await request(app.getHttpServer())
      .post('/todolist')
      .send(dto)
      .expect(201);

    expect(response.body).toHaveProperty('id');

    const id = response.body.id;

    const responseGet = await request(app.getHttpServer())
      .get('/todolist/' + id)
      .expect(200);

    expect(responseGet.body).toHaveProperty('id', id);

    dto.completed = true

    const responseChangeStatus = await request(app.getHttpServer())
      .get('/todolist/changeStatusTaskAsync/'+id)
      .expect(200);

    const responseGetAflterChange = await request(app.getHttpServer())
      .get('/todolist/' + id)
      .expect(200);

    expect(responseGetAflterChange.body).toHaveProperty('id', id);
    expect(responseGetAflterChange.body).toHaveProperty('completed', dto.completed);

  });

});
