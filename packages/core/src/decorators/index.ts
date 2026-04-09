// Controller & HTTP method decorators
export {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Head,
  Options,
  HttpCode,
  Param,
  Query,
  Body,
  Headers,
  Req,
  Res,
  UseGuard,
  getControllerRegistry,
  getControllerMetadata,
  type HttpMethod,
  type RouteMetadata,
  type ControllerMetadata,
  type ParamMetadata,
} from "./controller.js";

// Service & Repository decorators
export {
  Service,
  Repository,
  Scheduled,
  getServiceRegistry,
  getRepositoryRegistry,
  getScheduledTasks,
  type ServiceMetadata,
  type RepositoryMetadata,
  type ScheduledTask,
} from "./service.js";

// DTO validation decorators
export {
  IsString,
  IsNumber,
  IsBoolean,
  IsInt,
  IsEmail,
  IsUrl,
  IsUUID,
  IsDateString,
  IsArray,
  IsEnum,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
  Default,
  buildDTOSchema,
  validateDTO,
  safeValidateDTO,
} from "./dto.js";

// Guard, Interceptor & Exception handling
export {
  Guard,
  UseInterceptor,
  ExceptionHandler,
  getGuardRegistry,
  getInterceptorRegistry,
  getFilterRegistry,
  type RequestContext,
  type CanActivate,
  type Interceptor,
  type ExceptionFilter,
  type ExceptionResponse,
} from "./guard.js";

// HTTP Exceptions
export {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  MethodNotAllowedException,
  ConflictException,
  UnprocessableEntityException,
  TooManyRequestsException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from "../exceptions/http.js";

// DI Container
export { Container, Injectable, Inject, type Constructor, type Scope } from "../di/container.js";
