import { PartialType } from '@nestjs/swagger';
import { CreateTodolistDto } from './create-todolist.dto';
import { IsString, IsNotEmpty, MaxLength, IsBoolean } from 'class-validator';

export class UpdateTodolistDto extends PartialType(CreateTodolistDto) {
  @IsString({ message: 'The title should be a string.' })
  @IsNotEmpty({ message: 'The title cannot be empty.' })
  @MaxLength(100, { message: 'The title cannot have more than 100 characters.' })
  title: string;

  @IsString({ message: 'The description should be a string.' })
  @IsNotEmpty({ message: 'The description cannot be empty.' })
  @MaxLength(500, { message: 'The description cannot have more than 500 characters.' })
  description: string;

  @IsBoolean({ message: 'The completed field should be a boolean.' })
  completed: boolean;
}
