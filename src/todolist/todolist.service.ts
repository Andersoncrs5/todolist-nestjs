import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTodolistDto } from './dto/create-todolist.dto';
import { UpdateTodolistDto } from './dto/update-todolist.dto';
import { Todo } from './entities/todolist.entity';

@Injectable()
export class TodolistService {
  constructor(
    @InjectRepository(Todo)
    private readonly todolistRepository: Repository<Todo>,
  ) {}

  async createAsync(createTodolistDto: CreateTodolistDto): Promise<Todo> {
    const queryRunner = this.todolistRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const task = queryRunner.manager.create(Todo, createTodolistDto);
      await queryRunner.manager.save(task);
      
      await queryRunner.commitTransaction();
      return task; 
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; 
    } finally {
      await queryRunner.release();
    }
  }

  async findAllAsync(): Promise<Todo[]> {
    try {
      return await this.todolistRepository.find();
    } catch (error) {
      throw error;
    }
  }

  async findOneAsync(id: number): Promise<Todo | null> {
    try {
      const task = await this.todolistRepository.findOne({
        where: { id },
      });
      return task ?? null;
    } catch (error) {
      throw error;
    }
  }

  async updateAsync(id: number, updateTodolistDto: UpdateTodolistDto) {
    const queryRunner = this.todolistRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Todo, id, updateTodolistDto);
      const updatedTask = await queryRunner.manager.findOne(Todo, { where: { id } });

      await queryRunner.commitTransaction();
      return updatedTask;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; 
    } finally {
      await queryRunner.release();
    }
  }

  async removeAsync(id: number) {
    const queryRunner = this.todolistRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(Todo, id); 
      await queryRunner.commitTransaction(); 
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async changeStatusTaskAsync(id: number) {
    const queryRunner = this.todolistRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
  
    try {
      const taskFound = await queryRunner.manager.findOne(Todo, { where: { id } });
  
      if (!taskFound) {
        throw new Error(`Task with ID ${id} not found.`);
      }
  
      taskFound.completed = !taskFound.completed;
  
      await queryRunner.manager.save(taskFound);
      await queryRunner.commitTransaction();
  
      return taskFound;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; 
    } finally {
      await queryRunner.release();
    }
  }
  
}
