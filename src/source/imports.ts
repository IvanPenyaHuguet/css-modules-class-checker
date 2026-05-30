import path from "node:path";
import { matchesCssModuleFile } from "../config.js";
import type { CssModuleFileMatcher, CssModuleImport } from "../types.js";
import type { AstNode } from "./ast.js";
import { getIdentifierName, getStringLiteralValue, isAstNode } from "./ast.js";

export function findCssModuleImports(
  program: AstNode,
  filePath: string,
  matchFiles?: CssModuleFileMatcher[]
): CssModuleImport[] {
  const imports: CssModuleImport[] = [];
  const body = Array.isArray(program.body) ? program.body : [];

  for (const statement of body) {
    if (!isImportDeclaration(statement)) {
      continue;
    }

    const importPath = getStringLiteralValue(statement.source);
    const cssModulePath = importPath ? path.resolve(path.dirname(filePath), importPath) : undefined;

    if (
      !importPath ||
      !cssModulePath ||
      !matchesCssModuleFile(importPath, cssModulePath, matchFiles)
    ) {
      continue;
    }

    const defaultSpecifier = statement.specifiers.find(isDefaultImportSpecifier);
    const localName = getIdentifierName(
      defaultSpecifier && isAstImportSpecifier(defaultSpecifier)
        ? defaultSpecifier.local
        : undefined
    );
    const namedImports = statement.specifiers
      .filter(isNamedImportSpecifier)
      .flatMap((specifier) => {
        const importedName = getImportSpecifierName(specifier.imported);
        const namedLocalName = getIdentifierName(specifier.local);

        return importedName && namedLocalName
          ? [
              {
                importedName,
                localName: namedLocalName,
                index: specifier.start ?? statement.start ?? 0
              }
            ]
          : [];
      });

    if (!localName && namedImports.length === 0) {
      continue;
    }

    imports.push({
      localName,
      namedImports,
      importPath,
      cssModulePath,
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

function isDefaultImportSpecifier(node: unknown): node is AstNode & { local: unknown } {
  return isAstImportSpecifier(node) && node.type === "ImportDefaultSpecifier";
}

function isNamedImportSpecifier(
  node: unknown
): node is AstNode & { imported: unknown; local: unknown } {
  return isAstImportSpecifier(node) && node.type === "ImportSpecifier" && "imported" in node;
}

function getImportSpecifierName(node: unknown): string | undefined {
  return getIdentifierName(node) ?? getStringLiteralValue(node);
}
