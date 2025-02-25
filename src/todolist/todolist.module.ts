import { Module } from '@nestjs/common';
import { TodolistService } from './todolist.service';
import { TodolistController } from './todolist.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from './entities/todolist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Todo])], 
  controllers: [TodolistController],
  providers: [TodolistService],
})
export class TodolistModule {}
