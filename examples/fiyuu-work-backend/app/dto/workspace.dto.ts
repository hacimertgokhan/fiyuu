import { IsString, MinLength, IsOptional, MaxLength, IsEnum } from "@fiyuu/core/decorators";

export class CreateWorkspaceDTO {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateWorkspaceDTO {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
  
  @IsOptional()
  @IsString()
  description?: string;
}

export class InviteMemberDTO {
  @IsEmail()
  email!: string;
  
  @IsEnum(["admin", "member", "viewer"])
  role: string = "member";
}

export class UpdateMemberDTO {
  @IsEnum(["admin", "member", "viewer"])
  role!: string;
}

import { IsEmail } from "@fiyuu/core/decorators";
