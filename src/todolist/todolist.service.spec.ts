import { Test, TestingModule } from '@nestjs/testing';
import { TodolistService } from './todolist.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Todo } from './entities/todolist.entity';
import { find } from 'rxjs';
import { CreateTodolistDto } from './dto/create-todolist.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';

jest.mock('nestjs-typeorm-paginate', () => ({
  ...jest.requireActual('nestjs-typeorm-paginate'),
  paginate: jest.fn()
}))

describe('TodolistService', () => {
  let service: TodolistService;
  let repository: Repository<Todo>

  beforeAll(async () => {
    initializeTransactionalContext();

    const dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Todo],
      synchronize: true,
    });

    await dataSource.initialize();
    addTransactionalDataSource(dataSource);
  });

  const mockQueryBuilder: Partial<SelectQueryBuilder<Todo>> = {
    orderBy: jest.fn().mockReturnThis()
  }

  const mockTodoRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodolistService,
        {
          provide: getRepositoryToken(Todo),
          useValue:{
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            create: jest.fn(),
            mockTodoRepository
          }
        }
      ],
    }).compile();

    service = module.get<TodolistService>(TodolistService);
    repository = module.get<Repository<Todo>>(getRepositoryToken(Todo))
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get a task', async () => {
    const id: number = 1;
    const task: Todo = {
      id,
      title: 'task',
      description: 'task',
      completed: false,
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(service, 'findOneAsync').mockResolvedValueOnce(task);

    const result = await service.findOneAsync(id);

    expect(result.id).toEqual(id);
  });

  it('should add a task', async () => {
    const createDto: CreateTodolistDto = {
      title: 'task',
      description: 'task',
      completed: false,
    };

    const savedTask: Todo = {
      ...createDto,
      id: 1,
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createSpy = jest
      .spyOn(service['todolistRepository'], 'create')
      .mockReturnValue(savedTask);

    const saveSpy = jest
      .spyOn(service['todolistRepository'], 'save')
      .mockResolvedValue(savedTask);

    const result = await service.createAsync(createDto);

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(createDto);

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(savedTask);

    expect(result).toEqual(savedTask);
  });

  it('should throw badRequest', async () => {
    await expect(service.findOneAsync(NaN)).rejects.toThrow(BadRequestException)
    await expect(service.findOneAsync(-1)).rejects.toThrow(BadRequestException)
    await expect(service.findOneAsync(0)).rejects.toThrow(BadRequestException)
  });

  it('should throw NotFoundException', async () => {
    const id = 99999999999999;

    const findOne = jest.spyOn(service['todolistRepository'], 'findOne').mockResolvedValue(null);

    await expect(service.findOneAsync(id)).rejects.toThrow(NotFoundException);

    await expect(findOne).toHaveBeenCalledWith({ where : { id } });
    await expect(findOne).toHaveBeenCalledTimes(1)
  })

  it('should return paginated tasks', async () => {
    const mockedQueryBuilder: Partial<SelectQueryBuilder<Todo>> = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 1, title: 'Task 1' }] as Todo[]),
      getCount: jest.fn().mockResolvedValue(1),
    };

    jest.spyOn(service['todolistRepository'], 'createQueryBuilder')
      .mockReturnValue(mockedQueryBuilder as SelectQueryBuilder<Todo>);

    const options = {
      page: 1,
      limit: 10,
      route: 'http://localhost:3000/tasks',
    };

    const result = await service.findAllAsync(options);

    expect(mockedQueryBuilder.orderBy).toHaveBeenCalledWith('task.createdAt', 'DESC');
  });

  it('should update a task', async ()=> {
    const id = 1;
    const existingTask: Todo = {
      id,
      title: 'Old Title',
      description: 'Old Description',
      completed: false,
      version: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updateDto = {
      title: 'New Title',
      description: 'New Description',
      completed: true,
    };

    const updateSpy = jest.spyOn(service['todolistRepository'], 'update')
    .mockResolvedValue({ affected: 1 } as any );

    jest.spyOn(service, 'findOneAsync').mockResolvedValue(existingTask);

    const result = await service.updateAsync(id, updateDto);

    expect(service.findOneAsync).toHaveBeenCalledWith(id)
    expect(service.findOneAsync).toHaveBeenCalledTimes(1);

    expect(updateSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith(id, {
      ...updateDto,
      version: existingTask.version
    });
    expect(updateSpy).toHaveBeenCalledTimes(1);

    expect(result).toEqual({ affected: 1 })
  });

  it('should delete a task', async ()=> {
    const id = 2;

    const task: Todo = {
      id,
      title: 'Task to delete',
      description: 'To be removed',
      completed: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(service, 'findOneAsync').mockResolvedValue(task);

    const deleteSpy = jest.spyOn(service['todolistRepository'], 'delete')
    .mockResolvedValue({ affected: 1 } as any)

    const result = await service.removeAsync(id);

    expect(service.findOneAsync).toHaveBeenCalled()
    expect(service.findOneAsync).toHaveBeenCalledWith(id)
    expect(service.findOneAsync).toHaveBeenCalledTimes(1);

    expect(deleteSpy).toHaveBeenCalled()
    expect(deleteSpy).toHaveBeenCalledWith(task);
    expect(deleteSpy).toHaveBeenCalledTimes(1);

    expect(result).toBe('Task deleted with success!')
  });

  it('should change the status of task', async () => {
    const id = 1;

    const task: Todo = {
      id,
      title: 'Task to change status',
      description: 'To be updated',
      completed: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(service, 'findOneAsync').mockResolvedValue(task);

    const updateSpy = jest.spyOn(service['todolistRepository'], 'update')
      .mockResolvedValue({ affected: 1 } as any);

    const result = await service.changeStatusTaskAsync(id);

    expect(service.findOneAsync).toHaveBeenCalledTimes(2);
    expect(service.findOneAsync).toHaveBeenCalledWith(id);

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith(id, {
      ...task,
      completed: true,
    });

    expect(result).toEqual({ affected: 1 });
  });

});