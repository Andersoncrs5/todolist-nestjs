import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodolistModule } from './todolist/todolist.module';
import { Todo } from './todolist/entities/todolist.entity';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    TodolistModule,
    TypeOrmModule.forRootAsync({
      useFactory() {
        return {
          type: 'postgres',        
          host: 'localhost',       
          port: 5432,              
          username: 'postgres',    
          password: '', 
          database: 'todolist_api_nest', 
          entities: [Todo],            
          synchronize: true,    
        }
      },
      async dataSourceFactory(options) {
      if (!options) {
        throw new Error('Invalid options passed');
      }

      return addTransactionalDataSource(new DataSource(options));
    }, 
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
