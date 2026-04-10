import { IsString, IsEmail, MinLength, IsOptional } from "@fiyuu/core/decorators";

export class RegisterDTO {
  @IsString()
  @MinLength(2)
  name!: string;
  
  @IsEmail()
  email!: string;
  
  @IsString()
  @MinLength(6)
  password!: string;
}

export class LoginDTO {
  @IsEmail()
  email!: string;
  
  @IsString()
  password!: string;
}

export class RefreshTokenDTO {
  @IsString()
  refreshToken!: string;
}

export class UpdateProfileDTO {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
  
  @IsOptional()
  @IsString()
  avatar?: string;
}
