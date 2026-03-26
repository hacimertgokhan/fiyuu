import { z } from "zod";
import type React from "react";

export type AnyZodSchema = z.ZodTypeAny;

export interface SchemaContract<TInput extends AnyZodSchema = AnyZodSchema, TOutput extends AnyZodSchema = AnyZodSchema> {
  input: TInput;
  output: TOutput;
  description: string;
}

export interface ActionDefinition<TInput extends AnyZodSchema = AnyZodSchema, TOutput extends AnyZodSchema = AnyZodSchema>
  extends SchemaContract<TInput, TOutput> {
  kind: "action";
}

export interface QueryDefinition<TInput extends AnyZodSchema = AnyZodSchema, TOutput extends AnyZodSchema = AnyZodSchema>
  extends SchemaContract<TInput, TOutput> {
  kind: "query";
}

export interface MetaDefinition {
  intent: string;
  title?: string;
  render?: RenderMode;
  seo?: {
    title?: string;
    description?: string;
  };
}

export interface PageDefinition {
  kind: "page";
  intent: string;
}

export interface LayoutDefinition {
  kind: "layout";
  name?: string;
}

export type RenderMode = "ssr" | "csr";

export interface PageProps<TData = unknown> {
  data: TData | null;
  route: string;
  intent: string;
  render: RenderMode;
}

export interface LayoutProps {
  children: React.ReactNode;
  route: string;
}

export function defineAction<TInput extends AnyZodSchema, TOutput extends AnyZodSchema>(config: SchemaContract<TInput, TOutput>): ActionDefinition<TInput, TOutput> {
  return {
    kind: "action",
    ...config,
  };
}

export function defineQuery<TInput extends AnyZodSchema, TOutput extends AnyZodSchema>(config: SchemaContract<TInput, TOutput>): QueryDefinition<TInput, TOutput> {
  return {
    kind: "query",
    ...config,
  };
}

export function definePage(config: { intent: string }): PageDefinition {
  return {
    kind: "page",
    ...config,
  };
}

export function defineLayout(config: { name?: string } = {}): LayoutDefinition {
  return {
    kind: "layout",
    ...config,
  };
}

export function defineMeta(config: MetaDefinition): MetaDefinition {
  return config;
}
