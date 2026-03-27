import { z } from "zod";

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

export interface QueryCacheConfig {
  /** Cache TTL in seconds. Set to 0 to disable. */
  ttl: number;
  /** Cache key varies by these URL query string parameters. */
  vary?: string[];
}

export interface MetaDefinition {
  intent: string;
  title?: string;
  render?: RenderMode;
  /**
   * Mark this page as zero-JS.
   * `fiyuu doctor` will warn if <script> tags are detected in page.tsx.
   */
  noJs?: boolean;
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

export type RenderMode = "ssr" | "csr" | "ssg";

export interface PageProps<TData = unknown> {
  data: TData | null;
  route: string;
  intent: string;
  render: RenderMode;
  /** Dynamic route parameters extracted from the URL, e.g. { id: "42" } for /blog/[id] */
  params: Record<string, string>;
}

export interface LayoutProps {
  children: string;
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
