import { IsString, IsNotEmpty, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from "class-transformer";
import * as sanitizeHtml from "sanitize-html";

export class CreateTodolistDto {
  @IsString({ message: 'O título deve ser uma string.' })
  @IsNotEmpty({ message: 'O título não pode estar vazio.' })
  @MaxLength(100, { message: 'O título não pode ter mais de 100 caracteres.' })
  @ApiProperty({ example: "task" })
  @Transform(({ value }) => sanitizeHtml(value) )
  title: string;

  @IsString({ message: 'A descrição deve ser uma string.' })
  @IsNotEmpty({ message: 'A descrição não pode estar vazia.' })
  @MaxLength(500, { message: 'A descrição não pode ter mais de 500 caracteres.' })
  @ApiProperty({ example: "task description" })
  @Transform(({ value }) => sanitizeHtml(value) )
  description: string;

  @IsBoolean({ message: 'the completed should to be a boolean'})
  @ApiProperty({ example: false })
  completed: boolean;
}
