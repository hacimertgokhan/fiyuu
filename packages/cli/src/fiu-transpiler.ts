/**
 * .fiu → TypeScript transpiler.
 *
 * parseFiuFile() çıktısını alır, geçerli TypeScript üretir.
 * Çıktı dosyası .fiu.ts uzantısıyla yazılır, build pipeline'a dahil edilir.
 *
 * Üretilen kod örneği:
 *
 *   import { html, defineComponent, compose, actState } from "@fiyuu/core";
 *   import { Component } from "@geajs/core";
 *
 *   export const Nav = defineComponent<Record<string, never>>(() => html`...`);
 *
 *   export default class HomePage extends Component {
 *     template({ data }: any = this.props) {
 *       const locale = actState("tr");
 *       const category = actState("all");
 *       return compose(Nav(), Hero({ profile: data }));
 *     }
 *   }
 */

import type { FiuFile, FiuComponentDecl, FiuDecorator, FiuTemplate } from "./fiu-parser.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function indent(str: string, spaces = 2): string {
  const pad = " ".repeat(spaces);
  return str
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : pad + line))
    .join("\n");
}

function getDecoratorArg(decorator: FiuDecorator, key: string): string | undefined {
  return decorator.args.find((a) => a.key === key)?.value;
}

function findDecorator(decorators: FiuDecorator[], name: string): FiuDecorator | undefined {
  return decorators.find((d) => d.name === name);
}

// ─── Template body dönüşümü ───────────────────────────────────────────────────

function transformTemplateBody(body: string, componentNames: Set<string>): string {
  // .fiu template body içinde JSX-benzeri <ComponentName /> ifadelerini
  // compose() çağrısı ve string interpolasyon kullanımına dönüştür.
  // Bu basit bir regex dönüşümüdür — tam bir JSX parser değil.
  // Örn: <Nav /> → Nav()
  // Örn: <Hero profile={data} /> → Hero({ profile: data })

  let result = body.trim();

  // Öz-kapanan component tag'leri: <Name prop={val} ... />
  result = result.replace(
    /<([A-Z][a-zA-Z0-9]*)((?:\s+\w+=\{[^}]*\})*)\s*\/>/g,
    (_match, name: string, attrs: string) => {
      if (!componentNames.has(name)) return _match;
      const props = parseJsxAttrs(attrs);
      if (Object.keys(props).length === 0) return `${name}({})`;
      const propsStr = Object.entries(props)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      return `${name}({ ${propsStr} })`;
    },
  );

  // Açık/kapanış tag'leri: <Name>...</Name> → basit string wrap
  for (const name of Array.from(componentNames)) {
    const open = new RegExp(`<${name}([^>]*)>`, "g");
    const close = new RegExp(`</${name}>`, "g");
    result = result.replace(open, (_m, attrs: string) => {
      const props = parseJsxAttrs(attrs);
      const propsStr = Object.entries(props).map(([k, v]) => `${k}: ${v}`).join(", ");
      return `${name}({ ${propsStr}, children: html\``;
    });
    result = result.replace(close, "`})");
  }

  return result;
}

function parseJsxAttrs(attrs: string): Record<string, string> {
  const result: Record<string, string> = {};
  // prop={expr} kalıbı
  const re = /(\w+)=\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrs)) !== null) {
    result[match[1]] = match[2].trim();
  }
  return result;
}

// ─── Component → TypeScript ──────────────────────────────────────────────────

function transpilePageComponent(
  decl: FiuComponentDecl,
  pageDecorator: FiuDecorator,
  componentNames: Set<string>,
): string {
  const mode = getDecoratorArg(pageDecorator, "mode") ?? "ssr";
  const route = getDecoratorArg(pageDecorator, "route");
  const queryDecl = decl.queries[0];
  const tmpl = decl.template;

  const stateLines = decl.states.map(
    (s) => `const ${s.name} = actState(${JSON.stringify(s.initialValue)});`,
  );

  const templateParams = tmpl?.params ?? ["data"];
  const templateBody = tmpl
    ? transformTemplateBody(tmpl.body, componentNames)
    : "return html`<!-- empty template -->`";

  const lines: string[] = [];

  // page meta export
  lines.push(`export const page = { intent: "${decl.name}", mode: "${mode}"${route ? `, route: "${route}"` : ""} };`);
  lines.push("");

  if (queryDecl) {
    lines.push(`// Query bağlantısı: ${queryDecl.queryName}`);
  }

  lines.push(`export default class ${decl.name} extends Component {`);
  lines.push(
    `  template({ ${templateParams.join(", ")} }: any = this.props) {`,
  );

  for (const line of stateLines) {
    lines.push(`    ${line}`);
  }
  if (stateLines.length > 0) lines.push("");

  // template body'yi indent et
  const bodyLines = templateBody.split("\n");
  for (const bodyLine of bodyLines) {
    lines.push(`    ${bodyLine}`);
  }

  lines.push("  }");
  lines.push("}");

  return lines.join("\n");
}

function transpileRegularComponent(
  decl: FiuComponentDecl,
  componentNames: Set<string>,
): string {
  const tmpl = decl.template;
  const props = decl.props;

  // Props tipi
  const propsType =
    props.length === 0
      ? "Record<string, never>"
      : `{ ${props.map((p) => `${p}: any`).join("; ")} }`;

  const templateBody = tmpl
    ? transformTemplateBody(tmpl.body, componentNames)
    : "return html`<!-- empty -->`";

  const paramStr = props.length === 0 ? "_props" : `{ ${props.join(", ")} }`;

  const lines: string[] = [];
  lines.push(`export const ${decl.name} = defineComponent<${propsType}>((${paramStr}) => {`);
  lines.push(`  return html\`${templateBody.trim()}\`;`);
  lines.push(`});`);

  return lines.join("\n");
}

function transpileLayoutComponent(decl: FiuComponentDecl, componentNames: Set<string>): string {
  const tmpl = decl.template;
  const templateBody = tmpl
    ? transformTemplateBody(tmpl.body, componentNames)
    : "return html`<!-- layout -->`";

  return [
    `export default class ${decl.name} extends Component {`,
    `  template({ children }: any = this.props) {`,
    `    return html\`${templateBody.trim()}\`;`,
    `  }`,
    `}`,
  ].join("\n");
}

// ─── Ana Transpile Fonksiyonu ─────────────────────────────────────────────────

export function transpileFiuFile(file: FiuFile, sourcePath: string): string {
  const componentNames = new Set(file.components.map((c) => c.name));

  const sections: string[] = [];

  // Header
  sections.push(`// Auto-generated from ${sourcePath} — düzenleme yapma`);
  sections.push(`// Kaynak: ${sourcePath}`);
  sections.push("");

  // Framework imports
  sections.push(`import { html, defineComponent, compose, actState } from "@fiyuu/core";`);
  sections.push(`import { Component } from "@geajs/core";`);

  // Kullanıcı import'ları
  for (const imp of file.imports) {
    sections.push(imp);
  }

  sections.push("");

  // Component'leri sırala: önce regular, en son page/layout
  const regularComponents = file.components.filter(
    (c) =>
      !findDecorator(c.decorators, "page") &&
      !findDecorator(c.decorators, "layout"),
  );

  const pageComponent = file.components.find((c) => findDecorator(c.decorators, "page"));
  const layoutComponent = file.components.find((c) => findDecorator(c.decorators, "layout"));

  for (const decl of regularComponents) {
    sections.push(`// ─── ${decl.name} ────`);
    sections.push(transpileRegularComponent(decl, componentNames));
    sections.push("");
  }

  if (layoutComponent) {
    const layoutDec = findDecorator(layoutComponent.decorators, "layout")!;
    sections.push(`// ─── Layout: ${layoutComponent.name} ────`);
    sections.push(`export const layout = { intent: "${layoutComponent.name}" };`);
    sections.push(transpileLayoutComponent(layoutComponent, componentNames));
    sections.push("");
    void layoutDec;
  }

  if (pageComponent) {
    const pageDec = findDecorator(pageComponent.decorators, "page")!;
    sections.push(`// ─── Page: ${pageComponent.name} ────`);
    sections.push(transpilePageComponent(pageComponent, pageDec, componentNames));
  }

  return sections.join("\n");
}
