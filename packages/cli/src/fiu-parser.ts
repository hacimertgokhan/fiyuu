/**
 * .fiu dosya parser'ı.
 *
 * .fiu dosyaları blok tabanlı bir syntax kullanır:
 *
 *   @page(route="/", mode="ssr")
 *   component HomePage {
 *     @query → ProfileQuery
 *     @state locale = "tr"
 *
 *     template(data) {
 *       ...
 *     }
 *   }
 *
 *   @component
 *   component Nav {
 *     template() { ... }
 *   }
 *
 * Parser kaynak metni token'lara böler, ardından AST üretir.
 * Transpiler bu AST'ı TypeScript'e çevirir.
 */

// ─── Token Types ─────────────────────────────────────────────────────────────

export type TokenKind =
  | "decorator"      // @page, @component, @query, @state, @layout
  | "keyword"        // component, template
  | "ident"          // herhangi bir isim
  | "arrow"          // →
  | "equals"         // =
  | "lparen"         // (
  | "rparen"         // )
  | "lbrace"         // {
  | "rbrace"         // }
  | "string"         // "..." veya '...'
  | "raw_block"      // template body içindeki ham içerik
  | "comma"          // ,
  | "newline"
  | "eof";

export type Token = {
  kind: TokenKind;
  value: string;
  line: number;
  col: number;
};

// ─── AST Node Types ──────────────────────────────────────────────────────────

export type DecoratorArg = { key: string; value: string };

export type FiuDecorator = {
  name: string;       // "page" | "component" | "layout" | "query" | "state"
  args: DecoratorArg[];
};

export type FiuStateDecl = {
  kind: "state";
  name: string;
  initialValue: string;
};

export type FiuQueryDecl = {
  kind: "query";
  queryName: string;
};

export type FiuTemplate = {
  kind: "template";
  params: string[];   // template(data, ctx) → ["data", "ctx"]
  body: string;       // ham içerik, transpiler tarafından işlenir
};

export type FiuComponentDecl = {
  kind: "component";
  name: string;
  decorators: FiuDecorator[];
  states: FiuStateDecl[];
  queries: FiuQueryDecl[];
  template: FiuTemplate | null;
  props: string[];    // component(profile, locale) → ["profile", "locale"]
};

export type FiuFile = {
  components: FiuComponentDecl[];
  imports: string[];  // ham import satırları (dosya başındaki @import blokları)
};

// ─── Lexer ───────────────────────────────────────────────────────────────────

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  function peek(offset = 0): string {
    return source[pos + offset] ?? "";
  }

  function advance(): string {
    const ch = source[pos++] ?? "";
    if (ch === "\n") { line++; col = 1; } else { col++; }
    return ch;
  }

  function consume(expected: string): void {
    for (const ch of expected) {
      if (peek() !== ch) throw new Error(`[fiu] Expected '${ch}' at line ${line}:${col}`);
      advance();
    }
  }

  function skipWhitespace(): void {
    while (pos < source.length && /[ \t\r]/.test(peek())) advance();
  }

  function skipLineComment(): void {
    while (pos < source.length && peek() !== "\n") advance();
  }

  function readIdent(): string {
    let ident = "";
    while (pos < source.length && /[\w$]/.test(peek())) ident += advance();
    return ident;
  }

  function readString(quote: string): string {
    advance(); // opening quote
    let str = "";
    while (pos < source.length && peek() !== quote) {
      if (peek() === "\\") { advance(); str += advance(); }
      else str += advance();
    }
    consume(quote);
    return str;
  }

  // Reads a balanced {...} block, returns inner content
  function readBraceBlock(): string {
    consume("{");
    let depth = 1;
    let content = "";
    while (pos < source.length && depth > 0) {
      const ch = peek();
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) break; }
      content += advance();
    }
    consume("}");
    return content;
  }

  while (pos < source.length) {
    skipWhitespace();

    if (pos >= source.length) break;

    const startLine = line;
    const startCol = col;
    const ch = peek();

    // Line comment
    if (ch === "/" && peek(1) === "/") {
      skipLineComment();
      continue;
    }

    // Newline
    if (ch === "\n") {
      advance();
      tokens.push({ kind: "newline", value: "\n", line: startLine, col: startCol });
      continue;
    }

    // Decorator: @name
    if (ch === "@") {
      advance();
      const name = readIdent();
      tokens.push({ kind: "decorator", value: name, line: startLine, col: startCol });
      continue;
    }

    // Arrow →
    if (ch === "→" || (ch === "-" && peek(1) === ">")) {
      advance();
      if (ch === "-") advance();
      tokens.push({ kind: "arrow", value: "→", line: startLine, col: startCol });
      continue;
    }

    // String
    if (ch === '"' || ch === "'") {
      const str = readString(ch);
      tokens.push({ kind: "string", value: str, line: startLine, col: startCol });
      continue;
    }

    // Equals
    if (ch === "=") {
      advance();
      tokens.push({ kind: "equals", value: "=", line: startLine, col: startCol });
      continue;
    }

    // Parens
    if (ch === "(") {
      advance();
      tokens.push({ kind: "lparen", value: "(", line: startLine, col: startCol });
      continue;
    }
    if (ch === ")") {
      advance();
      tokens.push({ kind: "rparen", value: ")", line: startLine, col: startCol });
      continue;
    }

    // Comma
    if (ch === ",") {
      advance();
      tokens.push({ kind: "comma", value: ",", line: startLine, col: startCol });
      continue;
    }

    // Brace block (only when we see { directly)
    if (ch === "{") {
      const body = readBraceBlock();
      tokens.push({ kind: "raw_block", value: body, line: startLine, col: startCol });
      continue;
    }

    // Ident or keyword
    if (/[a-zA-Z_$]/.test(ch)) {
      const ident = readIdent();
      const keywords = ["component", "template", "import", "from"];
      tokens.push({
        kind: keywords.includes(ident) ? "keyword" : "ident",
        value: ident,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Skip unknown chars
    advance();
  }

  tokens.push({ kind: "eof", value: "", line, col });
  return tokens;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

class TokenStream {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  peek(offset = 0): Token {
    return this.tokens[this.pos + offset] ?? { kind: "eof", value: "", line: 0, col: 0 };
  }

  consume(): Token {
    return this.tokens[this.pos++] ?? { kind: "eof", value: "", line: 0, col: 0 };
  }

  expect(kind: TokenKind): Token {
    const tok = this.consume();
    if (tok.kind !== kind) {
      throw new Error(`[fiu] Expected ${kind}, got ${tok.kind} ("${tok.value}") at line ${tok.line}:${tok.col}`);
    }
    return tok;
  }

  skipNewlines(): void {
    while (this.peek().kind === "newline") this.consume();
  }

  is(kind: TokenKind, value?: string): boolean {
    const tok = this.peek();
    return tok.kind === kind && (value == null || tok.value === value);
  }
}

function parseDecoratorArgs(stream: TokenStream): DecoratorArg[] {
  const args: DecoratorArg[] = [];
  if (!stream.is("lparen")) return args;
  stream.consume(); // (

  while (!stream.is("rparen") && !stream.is("eof")) {
    stream.skipNewlines();
    if (stream.is("ident") || stream.is("keyword")) {
      const key = stream.consume().value;
      if (stream.is("equals")) {
        stream.consume(); // =
        const val = stream.consume(); // string or ident
        args.push({ key, value: val.value });
      } else {
        args.push({ key, value: "true" });
      }
    }
    stream.skipNewlines();
    if (stream.is("comma")) stream.consume();
  }

  if (stream.is("rparen")) stream.consume();
  return args;
}

function parseTemplate(stream: TokenStream): FiuTemplate {
  // template(params...) { body }
  const params: string[] = [];

  if (stream.is("lparen")) {
    stream.consume();
    while (!stream.is("rparen") && !stream.is("eof")) {
      stream.skipNewlines();
      if (stream.is("ident") || stream.is("keyword")) {
        params.push(stream.consume().value);
      }
      if (stream.is("comma")) stream.consume();
    }
    if (stream.is("rparen")) stream.consume();
  }

  stream.skipNewlines();
  const body = stream.expect("raw_block").value;

  return { kind: "template", params, body };
}

function parseComponentBody(stream: TokenStream): {
  states: FiuStateDecl[];
  queries: FiuQueryDecl[];
  template: FiuTemplate | null;
} {
  const states: FiuStateDecl[] = [];
  const queries: FiuQueryDecl[] = [];
  let template: FiuTemplate | null = null;

  stream.skipNewlines();

  while (!stream.is("eof")) {
    stream.skipNewlines();

    // @state name = value
    if (stream.is("decorator", "state")) {
      stream.consume();
      const name = stream.expect("ident").value;
      stream.expect("equals");
      const val = stream.consume();
      states.push({ kind: "state", name, initialValue: val.value });
      continue;
    }

    // @query → QueryName
    if (stream.is("decorator", "query")) {
      stream.consume();
      if (stream.is("arrow")) {
        stream.consume();
        const queryName = stream.consume().value;
        queries.push({ kind: "query", queryName });
      }
      continue;
    }

    // template(...) { ... }
    if (stream.is("keyword", "template")) {
      stream.consume();
      template = parseTemplate(stream);
      continue;
    }

    // End of component body — we hit something unexpected
    break;
  }

  return { states, queries, template };
}

function parseComponent(stream: TokenStream, decorators: FiuDecorator[]): FiuComponentDecl {
  // component Name(props?) { body }
  stream.expect("keyword"); // "component"
  const name = stream.expect("ident").value;

  const props: string[] = [];
  if (stream.is("lparen")) {
    stream.consume();
    while (!stream.is("rparen") && !stream.is("eof")) {
      stream.skipNewlines();
      if (stream.is("ident")) props.push(stream.consume().value);
      if (stream.is("comma")) stream.consume();
    }
    if (stream.is("rparen")) stream.consume();
  }

  stream.skipNewlines();
  const rawBody = stream.expect("raw_block").value;

  // Re-parse body
  const bodyTokens = tokenize(rawBody);
  const bodyStream = new TokenStream(bodyTokens);
  const { states, queries, template } = parseComponentBody(bodyStream);

  return { kind: "component", name, decorators, states, queries, template, props };
}

export function parseFiuFile(source: string): FiuFile {
  const tokens = tokenize(source);
  const stream = new TokenStream(tokens);
  const components: FiuComponentDecl[] = [];
  const imports: string[] = [];

  while (!stream.is("eof")) {
    stream.skipNewlines();

    if (stream.is("eof")) break;

    // @import blokları — ham string olarak sakla
    if (stream.is("decorator", "import")) {
      stream.consume();
      // rest of line as raw import
      let importLine = "import";
      while (!stream.is("newline") && !stream.is("eof")) {
        importLine += " " + stream.consume().value;
      }
      imports.push(importLine);
      continue;
    }

    // Dekoratörleri topla
    const decorators: FiuDecorator[] = [];
    while (stream.is("decorator")) {
      const name = stream.consume().value;
      const args = parseDecoratorArgs(stream);
      decorators.push({ name, args });
      stream.skipNewlines();
    }

    // component tanımı
    if (stream.is("keyword", "component")) {
      components.push(parseComponent(stream, decorators));
      continue;
    }

    // Tanımlanamayan token — atla
    stream.consume();
  }

  return { components, imports };
}
