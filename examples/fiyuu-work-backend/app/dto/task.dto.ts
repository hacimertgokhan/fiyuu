import { IsString, MinLength, IsOptional, MaxLength, IsEnum, IsDateString } from "@fiyuu/core/decorators";

export class CreateTaskDTO {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
  
  @IsOptional()
  @IsEnum(["todo", "in_progress", "review", "done"])
  status?: string = "todo";
  
  @IsOptional()
  @IsEnum(["low", "medium", "high", "urgent"])
  priority?: string = "medium";
  
  @IsString()
  projectId!: string;
  
  @IsOptional()
  @IsString()
  assigneeId?: string;
  
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateTaskDTO {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;
  
  @IsOptional()
  @IsString()
  description?: string;
  
  @IsOptional()
  @IsEnum(["todo", "in_progress", "review", "done"])
  status?: string;
  
  @IsOptional()
  @IsEnum(["low", "medium", "high", "urgent"])
  priority?: string;
  
  @IsOptional()
  @IsString()
  assigneeId?: string;
  
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class CreateCommentDTO {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}
