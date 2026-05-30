export type AstNode = {
  type?: string;
  start?: number;
  end?: number;
  [key: string]: unknown;
};

export function walkAst(
  node: unknown,
  visit: (node: AstNode, ancestors: AstNode[]) => void,
  ancestors: AstNode[] = [],
): void {
  if (!isAstNode(node)) {
    return;
  }

  visit(node, ancestors);

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walkAst(item, visit, [...ancestors, node]);
      }

      continue;
    }

    if (isAstNode(value)) {
      walkAst(value, visit, [...ancestors, node]);
    }
  }
}

export function isAstNode(value: unknown): value is AstNode {
  return typeof value === "object" && value !== null && "type" in value;
}

export function getIdentifierName(node: unknown): string | undefined {
  return isAstNode(node) && node.type === "Identifier" && typeof node.name === "string"
    ? node.name
    : undefined;
}

export function getStringLiteralValue(node: unknown): string | undefined {
  return isAstNode(node) && node.type === "Literal" && typeof node.value === "string"
    ? node.value
    : undefined;
}

export function getStaticPropertyName(node: unknown): string | undefined {
  return getIdentifierName(node) ?? getStringLiteralValue(node);
}
