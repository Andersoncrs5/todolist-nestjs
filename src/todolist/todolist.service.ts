import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTodolistDto } from './dto/create-todolist.dto';
import { UpdateTodolistDto } from './dto/update-todolist.dto';
import { Todo } from './entities/todolist.entity';
import { Transactional } from 'typeorm-transactional';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { takeLast } from 'rxjs';

@Injectable()
export class TodolistService {
  constructor(
    @InjectRepository(Todo)
    private readonly todolistRepository: Repository<Todo>,
  ) {}

  @Transactional()
  async createAsync(createTodolistDto: CreateTodolistDto): Promise<Todo> {
    const task = await this.todolistRepository.create(createTodolistDto);
    return await this.todolistRepository.save(task);  
  }

  async findAllAsync(options: IPaginationOptions) {
    const queryBuilder = await this.todolistRepository.createQueryBuilder('task');

    queryBuilder.orderBy('task.createdAt', 'DESC');

    return await paginate<Todo>(queryBuilder, options);
  }

  async findOneAsync(id: number): Promise<Todo> {
    if (!id || isNaN(id) || id <= 0) {
      throw new BadRequestException('ID must be a positive number');
    }

    const task = await this.todolistRepository.findOne({
      where: { id },
    });

    if (task == null) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  @Transactional()
  async updateAsync(id: number, updateTodolistDto: UpdateTodolistDto) {
    const task = await this.findOneAsync(id);
    const data = { ...updateTodolistDto, version: task.version }
    
    return await this.todolistRepository.update(id, data);
  }

  @Transactional()
  async removeAsync(id: number) {
    const task = await this.findOneAsync(id);
    await this.todolistRepository.delete(task); 

    return 'Task deleted with success!';
  }

  @Transactional()
  async changeStatusTaskAsync(id: number) {
    const taskFound = await this.findOneAsync(id);

    taskFound.completed = !taskFound.completed;

    return await this.updateAsync(id, taskFound);
  }
}