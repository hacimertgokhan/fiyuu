/**
 * Built-in HTTP exception classes.
 *
 * @example
 * ```ts
 * throw new NotFoundException("User not found");
 * throw new BadRequestException("Invalid email format");
 * throw new UnauthorizedException("Token expired");
 * throw new ForbiddenException("Admin access required");
 * ```
 */

export class HttpException extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpException";
  }

  toJSON() {
    return {
      status: this.status,
      error: this.name,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string = "Bad Request", details?: unknown) {
    super(400, message, details);
    this.name = "BadRequestException";
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = "Unauthorized", details?: unknown) {
    super(401, message, details);
    this.name = "UnauthorizedException";
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = "Forbidden", details?: unknown) {
    super(403, message, details);
    this.name = "ForbiddenException";
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string = "Not Found", details?: unknown) {
    super(404, message, details);
    this.name = "NotFoundException";
  }
}

export class MethodNotAllowedException extends HttpException {
  constructor(message: string = "Method Not Allowed", details?: unknown) {
    super(405, message, details);
    this.name = "MethodNotAllowedException";
  }
}

export class ConflictException extends HttpException {
  constructor(message: string = "Conflict", details?: unknown) {
    super(409, message, details);
    this.name = "ConflictException";
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(message: string = "Unprocessable Entity", details?: unknown) {
    super(422, message, details);
    this.name = "UnprocessableEntityException";
  }
}

export class TooManyRequestsException extends HttpException {
  constructor(message: string = "Too Many Requests", details?: unknown) {
    super(429, message, details);
    this.name = "TooManyRequestsException";
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message: string = "Internal Server Error", details?: unknown) {
    super(500, message, details);
    this.name = "InternalServerErrorException";
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(message: string = "Service Unavailable", details?: unknown) {
    super(503, message, details);
    this.name = "ServiceUnavailableException";
  }
}
