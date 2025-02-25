import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodolistModule } from './todolist/todolist.module';
import { Todo } from './todolist/entities/todolist.entity';

@Module({
  imports: [
    TodolistModule,
    TypeOrmModule.forRoot({
      type: 'postgres',        
      host: 'localhost',       
      port: 5432,              
      username: 'postgres',    
      password: '12345678', 
      database: 'todolist_api_nest', 
      entities: [Todo],            
      synchronize: true,       
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
