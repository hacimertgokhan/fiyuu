/**
 * DTO (Data Transfer Object) validation decorators.
 * These generate Zod schemas from decorated classes.
 */

import { z, type ZodTypeAny } from "zod";
import { defineMetadata, getOwnMetadata } from "../di/metadata.js";

// ── Metadata ─────────────────────────────────────────────────────────────

const DTO_FIELDS_KEY = Symbol("fiyuu:dto_fields");

interface FieldRule {
  propertyKey: string;
  rules: Array<{ type: string; args: unknown[] }>;
}

function addFieldRule(target: Object, propertyKey: string, ruleType: string, ...args: unknown[]) {
  const fields = (getOwnMetadata(DTO_FIELDS_KEY, target.constructor) as Map<string, FieldRule>) ?? new Map<string, FieldRule>();

  if (!fields.has(propertyKey)) {
    fields.set(propertyKey, { propertyKey, rules: [] });
  }

  fields.get(propertyKey)!.rules.push({ type: ruleType, args });
  defineMetadata(DTO_FIELDS_KEY, fields, target.constructor);
}

// ── Type validators ──────────────────────────────────────────────────────

export function IsString(): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "string");
}

export function IsNumber(): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "number");
}

export function IsBoolean(): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "boolean");
}

export function IsInt(): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "int");
}

export function IsEmail(): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "email");
}

export function IsUrl(): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "url");
}

export function IsUUID(): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "uuid");
}

export function IsDateString(): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "datestring");
}

export function IsArray(): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "array");
}

export function IsEnum(enumType: Record<string, string | number>): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "enum", enumType);
}

// ── Constraint validators ────────────────────────────────────────────────

export function IsOptional(): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "optional");
}

export function Min(value: number): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "min", value);
}

export function Max(value: number): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "max", value);
}

export function MinLength(value: number): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "minlength", value);
}

export function MaxLength(value: number): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "maxlength", value);
}

export function Matches(pattern: RegExp): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "matches", pattern);
}

export function Default(value: unknown): PropertyDecorator {
  return (target, key) => addFieldRule(target, String(key), "default", value);
}

// ── Schema builder ───────────────────────────────────────────────────────

/**
 * Build a Zod schema from a DTO class.
 */
export function buildDTOSchema(dtoClass: Function): z.ZodObject<Record<string, ZodTypeAny>> {
  const fields = (getOwnMetadata(DTO_FIELDS_KEY, dtoClass) as Map<string, FieldRule>) ?? new Map<string, FieldRule>();
  const shape: Record<string, ZodTypeAny> = {};

  for (const [key, field] of fields) {
    let schema: ZodTypeAny = z.any();
    let isOptional = false;

    for (const rule of field.rules) {
      switch (rule.type) {
        case "string": schema = z.string(); break;
        case "number": schema = z.number(); break;
        case "boolean": schema = z.boolean(); break;
        case "int": schema = z.number().int(); break;
        case "email": schema = z.string().email(); break;
        case "url": schema = z.string().url(); break;
        case "uuid": schema = z.string().uuid(); break;
        case "datestring": schema = z.string().datetime(); break;
        case "array": schema = z.array(z.any()); break;
        case "enum": {
          const enumValues = Object.values(rule.args[0] as Record<string, string>);
          schema = z.enum(enumValues as [string, ...string[]]);
          break;
        }
        case "optional": isOptional = true; break;
      }
    }

    for (const rule of field.rules) {
      switch (rule.type) {
        case "min":
          if (schema instanceof z.ZodString) schema = schema.min(rule.args[0] as number);
          else if (schema instanceof z.ZodNumber) schema = schema.min(rule.args[0] as number);
          break;
        case "max":
          if (schema instanceof z.ZodString) schema = schema.max(rule.args[0] as number);
          else if (schema instanceof z.ZodNumber) schema = schema.max(rule.args[0] as number);
          break;
        case "minlength":
          if (schema instanceof z.ZodString) schema = schema.min(rule.args[0] as number);
          break;
        case "maxlength":
          if (schema instanceof z.ZodString) schema = schema.max(rule.args[0] as number);
          break;
        case "matches":
          if (schema instanceof z.ZodString) schema = schema.regex(rule.args[0] as RegExp);
          break;
        case "default":
          schema = schema.default(rule.args[0]);
          break;
      }
    }

    shape[key] = isOptional ? schema.optional() : schema;
  }

  return z.object(shape);
}

/**
 * Validate input against a DTO class.
 */
export function validateDTO<T>(dtoClass: new () => T, data: unknown): T {
  const schema = buildDTOSchema(dtoClass);
  return schema.parse(data) as T;
}

/**
 * Safe validation - returns success/error result.
 */
export function safeValidateDTO<T>(
  dtoClass: new () => T,
  data: unknown,
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const schema = buildDTOSchema(dtoClass);
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as T };
  }
  return { success: false, error: result.error };
}

export { DTO_FIELDS_KEY };
