import { getLocation } from "../locations.js";
import type { ClassUsage, CssModuleImport, SourceLocation } from "../types.js";
import type { AstNode } from "./ast.js";
import { getIdentifierName, getStringLiteralValue, isAstNode, walkAst } from "./ast.js";
import { createStaticResolver } from "./resolve-static.js";

type RawClassUsage = {
  className: string;
  location: SourceLocation;
};

export function findCssModuleClassUsages(
  source: string,
  program: AstNode,
  imports: CssModuleImport[]
): ClassUsage[] {
  const usages: ClassUsage[] = [];
  const resolveStatic = createStaticResolver(program);
  const importsByLocalName = new Map(
    imports
      .filter((cssImport): cssImport is CssModuleImport & { localName: string } => {
        return typeof cssImport.localName === "string";
      })
      .map((cssImport) => [cssImport.localName, cssImport])
  );
  const namedImportsByLocalName = new Map(
    imports.flatMap((cssImport) => {
      return cssImport.namedImports.map((namedImport) => [
        namedImport.localName,
        { cssImport, namedImport }
      ]);
    })
  );

  walkAst(program, (node, ancestors) => {
    const identifierName = getIdentifierName(node);
    const namedImport = identifierName ? namedImportsByLocalName.get(identifierName) : undefined;

    if (namedImport && !isNonUsageIdentifier(node, ancestors)) {
      usages.push({
        kind: "resolved",
        localName: namedImport.namedImport.localName,
        className: namedImport.namedImport.importedName,
        cssModulePath: namedImport.cssImport.cssModulePath,
        location: getLocation(source, node.start ?? 0)
      });
      return;
    }

    if (node.type !== "MemberExpression") {
      return;
    }

    const objectName = getIdentifierName(node.object);
    const cssImport = objectName ? importsByLocalName.get(objectName) : undefined;

    if (!cssImport) {
      return;
    }

    const location = getLocation(source, node.start ?? 0);

    if (node.computed === false) {
      const className = getIdentifierName(node.property);

      if (!className) {
        return;
      }

      usages.push({
        kind: "resolved",
        localName: cssImport.localName,
        className,
        cssModulePath: cssImport.cssModulePath,
        location
      });
      return;
    }

    if (!isAstNode(node.property)) {
      return;
    }

    const resolved = resolveStatic(node.property);

    if (!resolved) {
      usages.push({
        kind: "unresolved",
        localName: cssImport.localName,
        cssModulePath: cssImport.cssModulePath,
        location
      });
      return;
    }

    for (const className of resolved) {
      usages.push({
        kind: "resolved",
        localName: cssImport.localName,
        className,
        cssModulePath: cssImport.cssModulePath,
        location
      });
    }
  });

  return usages;
}

function isNonUsageIdentifier(node: AstNode, ancestors: AstNode[]): boolean {
  const parent = ancestors.at(-1);

  if (ancestors.some((ancestor) => ancestor.type === "ImportDeclaration")) {
    return true;
  }

  if (parent?.type === "MemberExpression" && parent.property === node && parent.computed !== true) {
    return true;
  }

  if (parent?.type === "Property" && parent.key === node && parent.computed !== true) {
    return true;
  }

  return false;
}

export function findRawClassNameUsages(source: string, program: AstNode): RawClassUsage[] {
  const usages: RawClassUsage[] = [];

  walkAst(program, (node, ancestors) => {
    if (!isClassNameAttribute(node)) {
      return;
    }

    const value = node.value;

    if (!isAstNode(value)) {
      return;
    }

    const rawAttribute = getStringLiteralValue(value);

    if (rawAttribute !== undefined) {
      pushClassTokens(usages, source, rawAttribute, value.start ?? node.start ?? 0);
      return;
    }

    if (value.type !== "JSXExpressionContainer" || !isAstNode(value.expression)) {
      return;
    }

    walkAst(
      value.expression,
      (expressionNode, expressionAncestors) => {
        if (isComputedMemberProperty(expressionNode, expressionAncestors)) {
          return;
        }

        if (isStaticObjectPropertyKey(expressionNode, expressionAncestors)) {
          return;
        }

        if (expressionNode.type === "Property" && expressionNode.computed !== true) {
          const key = getStaticClassObjectKey(expressionNode);

          if (key !== undefined) {
            pushClassTokens(usages, source, key, expressionNode.start ?? value.start ?? 0);
          }
        }

        const stringValue = getStringLiteralValue(expressionNode);

        if (stringValue !== undefined) {
          pushClassTokens(usages, source, stringValue, expressionNode.start ?? value.start ?? 0);
          return;
        }

        if (expressionNode.type === "TemplateLiteral") {
          const templateValue = getStaticTemplateValue(expressionNode);

          if (templateValue !== undefined) {
            pushClassTokens(
              usages,
              source,
              templateValue,
              expressionNode.start ?? value.start ?? 0
            );
          }
        }
      },
      ancestors
    );
  });

  return usages;
}

function isClassNameAttribute(node: AstNode): node is AstNode & { value: unknown } {
  return (
    node.type === "JSXAttribute" &&
    isAstNode(node.name) &&
    node.name.type === "JSXIdentifier" &&
    node.name.name === "className"
  );
}

function isComputedMemberProperty(node: AstNode, ancestors: AstNode[]): boolean {
  const parent = ancestors.at(-1);

  return (
    parent?.type === "MemberExpression" && parent.computed === true && parent.property === node
  );
}

function isStaticObjectPropertyKey(node: AstNode, ancestors: AstNode[]): boolean {
  const parent = ancestors.at(-1);

  return parent?.type === "Property" && parent.computed !== true && parent.key === node;
}

function getStaticClassObjectKey(node: AstNode): string | undefined {
  const key = node.key;

  if (!isAstNode(key)) {
    return undefined;
  }

  if (key.type === "Identifier") {
    return typeof key.name === "string" ? key.name : undefined;
  }

  return getStringLiteralValue(key);
}

function getStaticTemplateValue(node: AstNode): string | undefined {
  const expressions = Array.isArray(node.expressions) ? node.expressions : [];

  if (expressions.length > 0) {
    return undefined;
  }

  const quasi =
    Array.isArray(node.quasis) && isAstNode(node.quasis[0]) ? node.quasis[0] : undefined;
  const value = quasi?.value;

  return typeof value === "object" &&
    value !== null &&
    "cooked" in value &&
    typeof value.cooked === "string"
    ? value.cooked
    : undefined;
}

function pushClassTokens(
  usages: RawClassUsage[],
  source: string,
  value: string,
  index: number
): void {
  const tokens = value.split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    usages.push({
      className: token,
      location: getLocation(source, index)
    });
  }
}
