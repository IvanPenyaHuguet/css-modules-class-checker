import path from "node:path";
import type { CssModuleImport } from "../types.js";
import type { AstNode } from "./ast.js";
import { getIdentifierName, getStringLiteralValue, isAstNode } from "./ast.js";

export function findCssModuleImports(program: AstNode, filePath: string): CssModuleImport[] {
  const imports: CssModuleImport[] = [];
  const body = Array.isArray(program.body) ? program.body : [];

  for (const statement of body) {
    if (!isImportDeclaration(statement)) {
      continue;
    }

    const importPath = getStringLiteralValue(statement.source);

    if (!importPath?.endsWith(".module.css")) {
      continue;
    }

    const defaultSpecifier = statement.specifiers.find((specifier) => {
      return isAstImportSpecifier(specifier) && specifier.type === "ImportDefaultSpecifier";
    });
    const localName = getIdentifierName(
      defaultSpecifier && isAstImportSpecifier(defaultSpecifier)
        ? defaultSpecifier.local
        : undefined
    );

    if (!localName) {
      continue;
    }

    imports.push({
      localName,
      importPath,
      cssModulePath: path.resolve(path.dirname(filePath), importPath),
      index: statement.start ?? 0
    });
  }

  return imports;
}

function isImportDeclaration(node: unknown): node is AstNode & {
  source: unknown;
  specifiers: unknown[];
} {
  return isAstNode(node) && node.type === "ImportDeclaration" && Array.isArray(node.specifiers);
}

function isAstImportSpecifier(node: unknown): node is AstNode & { local: unknown } {
  return isAstNode(node) && "local" in node;
}
