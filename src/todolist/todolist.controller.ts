import { Controller, Get, Post, Body, Put, Param, Delete, DefaultValuePipe, ParseIntPipe, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { TodolistService } from './todolist.service';
import { CreateTodolistDto } from './dto/create-todolist.dto';
import { UpdateTodolistDto } from './dto/update-todolist.dto';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import { Todo } from './entities/todolist.entity';
import { Pagination } from 'nestjs-typeorm-paginate';
import { UpdateResult } from 'typeorm';

@Controller('todolist')
export class TodolistController {
  constructor(private readonly todolistService: TodolistService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Pagination<Todo>> {
    page = page < 1 ? 1 : page;
    limit = limit > 100 ? 100 : limit;

    return await this.todolistService.findAllAsync({ page, limit });
  }

  @Post()
  @ApiBody({ type: CreateTodolistDto })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTodolistDto: CreateTodolistDto) {
    return await this.todolistService.createAsync(createTodolistDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return await this.todolistService.findOneAsync(+id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: UpdateTodolistDto })
  async update(@Param('id') id: number, @Body() updateTodolistDto: UpdateTodolistDto): Promise<UpdateResult> {
    return await this.todolistService.updateAsync(+id, updateTodolistDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return await this.todolistService.removeAsync(+id);
  }

  @Get('/changeStatusTaskAsync/:id')
  @HttpCode(HttpStatus.OK)
  async changeStatusTask(@Param('id') id: string) {
    return await this.todolistService.changeStatusTaskAsync(+id);
  }

  
}
