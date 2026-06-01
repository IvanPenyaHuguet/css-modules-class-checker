import type { AstNode } from "./ast.js";
import {
  getIdentifierName,
  getStaticPropertyName,
  getStringLiteralValue,
  isAstNode,
  walkAst
} from "./ast.js";

export function createStaticResolver(
  program: AstNode
): (expression: AstNode) => string[] | undefined {
  const constants = new Map<string, string[]>();
  const objectConstants = new Map<string, Map<string, string[]>>();
  const typeAliases = new Map<string, string[]>();
  const objectTypeAliases = new Map<string, Map<string, string[]>>();

  walkAst(program, (node) => {
    if (node.type === "TSTypeAliasDeclaration") {
      collectTypeAlias(node, objectConstants, typeAliases, objectTypeAliases);
      return;
    }

    if (node.type === "TSEnumDeclaration") {
      collectEnumDeclaration(node, objectConstants);
      return;
    }

    if (node.type === "VariableDeclarator") {
      collectVariableDeclarator(node, constants, objectConstants);
      return;
    }

    collectTypedBinding(node, constants, objectConstants, typeAliases, objectTypeAliases);
  });

  return (expression: AstNode) => resolveExpression(expression, constants, objectConstants);
}

function collectTypeAlias(
  node: AstNode,
  objectConstants: Map<string, Map<string, string[]>>,
  typeAliases: Map<string, string[]>,
  objectTypeAliases: Map<string, Map<string, string[]>>
): void {
  const identifier = getIdentifierName(node.id);

  if (!identifier || !isAstNode(node.typeAnnotation)) {
    return;
  }

  const resolvedObject = resolveObjectTypeAnnotation(
    node.typeAnnotation,
    objectConstants,
    typeAliases
  );

  if (resolvedObject) {
    objectTypeAliases.set(identifier, resolvedObject);
    return;
  }

  const resolved = resolveTypeAnnotation(node.typeAnnotation, objectConstants, typeAliases);

  if (resolved) {
    typeAliases.set(identifier, resolved);
  }
}

function collectEnumDeclaration(
  node: AstNode,
  objectConstants: Map<string, Map<string, string[]>>
): void {
  const identifier = getIdentifierName(node.id);
  const members = isAstNode(node.body) && Array.isArray(node.body.members) ? node.body.members : [];
  const enumValues = new Map<string, string[]>();

  if (!identifier) {
    return;
  }

  for (const member of members) {
    if (!isAstNode(member)) {
      continue;
    }

    const key = getStaticPropertyName(member.id);
    const value = isAstNode(member.initializer)
      ? getStringLiteralValue(member.initializer)
      : undefined;

    if (key && value !== undefined) {
      enumValues.set(key, [value]);
    }
  }

  if (enumValues.size > 0) {
    objectConstants.set(identifier, enumValues);
  }
}

function collectVariableDeclarator(
  node: AstNode,
  constants: Map<string, string[]>,
  objectConstants: Map<string, Map<string, string[]>>
): void {
  const identifier = getIdentifierName(node.id);

  if (!identifier || !isAstNode(node.init)) {
    return;
  }

  const objectResolved = resolveObjectExpression(node.init, constants, objectConstants);

  if (objectResolved) {
    objectConstants.set(identifier, objectResolved);
    return;
  }

  const resolved = resolveExpression(node.init, constants, objectConstants);

  if (resolved) {
    constants.set(identifier, resolved);
  }
}

function collectTypedBinding(
  node: AstNode,
  constants: Map<string, string[]>,
  objectConstants: Map<string, Map<string, string[]>>,
  typeAliases: Map<string, string[]>,
  objectTypeAliases: Map<string, Map<string, string[]>>
): void {
  const identifier = getIdentifierName(node);

  if (identifier && isAstNode(node.typeAnnotation)) {
    const resolved = resolveTypeAnnotation(node.typeAnnotation, objectConstants, typeAliases);

    if (resolved) {
      constants.set(identifier, resolved);
    }
  }

  if (node.type !== "ObjectPattern" || !isAstNode(node.typeAnnotation)) {
    return;
  }

  const objectTypeProperties = getObjectTypeProperties(
    node.typeAnnotation,
    objectConstants,
    typeAliases,
    objectTypeAliases
  );

  if (!objectTypeProperties) {
    return;
  }

  for (const [propertyName, propertyValues] of objectTypeProperties) {
    const bindingName = findObjectPatternBindingName(node, propertyName);

    if (bindingName) {
      constants.set(bindingName, propertyValues);
    }
  }
}

function resolveExpression(
  expression: AstNode,
  constants: Map<string, string[]>,
  objectConstants: Map<string, Map<string, string[]>>
): string[] | undefined {
  const literal = getStringLiteralValue(expression);

  if (literal !== undefined) {
    return [literal];
  }

  if (expression.type === "TemplateLiteral") {
    return resolveTemplateLiteral(expression, constants, objectConstants);
  }

  const identifier = getIdentifierName(expression);

  if (identifier) {
    return constants.get(identifier);
  }

  if (expression.type === "MemberExpression") {
    const objectName = getIdentifierName(expression.object);
    const propertyName = getStaticPropertyName(expression.property);

    if (objectName && propertyName) {
      return objectConstants.get(objectName)?.get(propertyName);
    }
  }

  if (expression.type === "ConditionalExpression") {
    const consequent = isAstNode(expression.consequent)
      ? resolveExpression(expression.consequent, constants, objectConstants)
      : undefined;
    const alternate = isAstNode(expression.alternate)
      ? resolveExpression(expression.alternate, constants, objectConstants)
      : undefined;

    if (consequent && alternate) {
      return [...consequent, ...alternate];
    }
  }

  if (
    (expression.type === "ParenthesizedExpression" ||
      expression.type === "TSAsExpression" ||
      expression.type === "TSSatisfiesExpression" ||
      expression.type === "TSNonNullExpression" ||
      expression.type === "TSTypeAssertion") &&
    isAstNode(expression.expression)
  ) {
    return resolveExpression(expression.expression, constants, objectConstants);
  }

  return undefined;
}

function getObjectTypeProperties(
  annotation: AstNode,
  objectConstants: Map<string, Map<string, string[]>>,
  typeAliases: Map<string, string[]>,
  objectTypeAliases: Map<string, Map<string, string[]>>
): Map<string, string[]> | undefined {
  const typeNode = getTypeAnnotationBody(annotation);

  if (!typeNode) {
    return undefined;
  }

  if (typeNode.type === "TSTypeLiteral") {
    return resolveObjectTypeAnnotation(typeNode, objectConstants, typeAliases);
  }

  if (typeNode.type === "TSTypeReference") {
    const typeName = getIdentifierName(typeNode.typeName);
    return typeName ? objectTypeAliases.get(typeName) : undefined;
  }

  return undefined;
}

function resolveObjectTypeAnnotation(
  annotation: AstNode,
  objectConstants: Map<string, Map<string, string[]>>,
  typeAliases: Map<string, string[]>
): Map<string, string[]> | undefined {
  const typeNode = getTypeAnnotationBody(annotation);

  if (!typeNode || typeNode.type !== "TSTypeLiteral" || !Array.isArray(typeNode.members)) {
    return undefined;
  }

  const properties = new Map<string, string[]>();

  for (const member of typeNode.members) {
    if (!isAstNode(member) || member.type !== "TSPropertySignature") {
      return undefined;
    }

    const propertyName = getStaticPropertyName(member.key);
    const propertyValues = isAstNode(member.typeAnnotation)
      ? resolveTypeAnnotation(member.typeAnnotation, objectConstants, typeAliases)
      : undefined;

    if (!propertyName || !propertyValues) {
      continue;
    }

    properties.set(propertyName, propertyValues);
  }

  return properties.size > 0 ? properties : undefined;
}

function resolveObjectExpression(
  expression: AstNode,
  constants: Map<string, string[]>,
  objectConstants: Map<string, Map<string, string[]>>
): Map<string, string[]> | undefined {
  const objectExpression =
    expression.type === "TSAsExpression" && isAstNode(expression.expression)
      ? expression.expression
      : expression;

  if (objectExpression.type !== "ObjectExpression") {
    return undefined;
  }

  const properties = Array.isArray(objectExpression.properties) ? objectExpression.properties : [];
  const result = new Map<string, string[]>();

  for (const property of properties) {
    if (!isAstNode(property) || property.type !== "Property" || property.computed === true) {
      return undefined;
    }

    const key = getStaticPropertyName(property.key);
    const value = isAstNode(property.value)
      ? resolveExpression(property.value, constants, objectConstants)
      : undefined;

    if (!key || !value) {
      return undefined;
    }

    result.set(key, value);
  }

  return result;
}

function resolveTemplateLiteral(
  expression: AstNode,
  constants: Map<string, string[]>,
  objectConstants: Map<string, Map<string, string[]>>
): string[] | undefined {
  const quasis = Array.isArray(expression.quasis) ? expression.quasis : [];
  const expressions = Array.isArray(expression.expressions) ? expression.expressions : [];

  if (quasis.length !== expressions.length + 1) {
    return undefined;
  }

  const resolvedExpressions: string[][] = [];

  for (const childExpression of expressions) {
    if (!isAstNode(childExpression)) {
      return undefined;
    }

    const resolved = resolveExpression(childExpression, constants, objectConstants);

    if (!resolved) {
      return undefined;
    }

    resolvedExpressions.push(resolved);
  }

  const firstQuasi = getTemplateQuasiValue(quasis[0]);

  if (firstQuasi === undefined) {
    return undefined;
  }

  let results: string[] = [firstQuasi];

  for (let index = 0; index < resolvedExpressions.length; index += 1) {
    const nextQuasi = getTemplateQuasiValue(quasis[index + 1]);

    if (nextQuasi === undefined) {
      return undefined;
    }

    results = results.flatMap((prefix) =>
      resolvedExpressions[index].map((resolvedValue) => `${prefix}${resolvedValue}${nextQuasi}`)
    );
  }

  return results;
}

function getTemplateQuasiValue(quasi: unknown): string | undefined {
  if (!isAstNode(quasi)) {
    return undefined;
  }

  const value = quasi.value;

  return typeof value === "object" &&
    value !== null &&
    "cooked" in value &&
    typeof value.cooked === "string"
    ? value.cooked
    : undefined;
}

function resolveTypeAnnotation(
  annotation: AstNode,
  objectConstants: Map<string, Map<string, string[]>>,
  typeAliases: Map<string, string[]>
): string[] | undefined {
  const typeNode = getTypeAnnotationBody(annotation);

  if (!typeNode) {
    return undefined;
  }

  if (typeNode.type === "TSLiteralType") {
    const value = getStringLiteralValue(typeNode.literal);
    return value === undefined ? undefined : [value];
  }

  if (typeNode.type === "TSUnionType" && Array.isArray(typeNode.types)) {
    const values: string[] = [];

    for (const childType of typeNode.types) {
      if (!isAstNode(childType)) {
        return undefined;
      }

      const childValues = resolveTypeAnnotation(childType, objectConstants, typeAliases);

      if (!childValues) {
        return undefined;
      }

      values.push(...childValues);
    }

    return values;
  }

  if (typeNode.type === "TSParenthesizedType") {
    return isAstNode(typeNode.typeAnnotation)
      ? resolveTypeAnnotation(typeNode.typeAnnotation, objectConstants, typeAliases)
      : undefined;
  }

  if (typeNode.type === "TSTypeReference") {
    const typeName = getIdentifierName(typeNode.typeName);
    return typeName
      ? (typeAliases.get(typeName) ?? resolveObjectConstantValues(objectConstants.get(typeName)))
      : undefined;
  }

  if (typeNode.type === "TSIndexedAccessType") {
    return resolveIndexedAccessType(typeNode, objectConstants);
  }

  return undefined;
}

function resolveIndexedAccessType(
  typeNode: AstNode,
  objectConstants: Map<string, Map<string, string[]>>
): string[] | undefined {
  const objectName = getTypeQueryName(typeNode.objectType);

  if (!objectName || !isKeyofTypeQuery(typeNode.indexType, objectName)) {
    return undefined;
  }

  const objectValues = objectConstants.get(objectName);

  return resolveObjectConstantValues(objectValues);
}

function resolveObjectConstantValues(
  objectValues: Map<string, string[]> | undefined
): string[] | undefined {
  return objectValues ? [...new Set([...objectValues.values()].flat())] : undefined;
}

function isKeyofTypeQuery(node: unknown, objectName: string): boolean {
  return (
    isAstNode(node) &&
    node.type === "TSTypeOperator" &&
    node.operator === "keyof" &&
    getTypeQueryName(node.typeAnnotation) === objectName
  );
}

function getTypeQueryName(node: unknown): string | undefined {
  if (!isAstNode(node)) {
    return undefined;
  }

  if (node.type === "TSParenthesizedType") {
    return getTypeQueryName(node.typeAnnotation);
  }

  return node.type === "TSTypeQuery" ? getIdentifierName(node.exprName) : undefined;
}

function getTypeAnnotationBody(annotation: AstNode): AstNode | undefined {
  if (annotation.type === "TSTypeAnnotation" && isAstNode(annotation.typeAnnotation)) {
    return annotation.typeAnnotation;
  }

  return annotation;
}

function findObjectPatternBindingName(pattern: AstNode, propertyName: string): string | undefined {
  const properties = Array.isArray(pattern.properties) ? pattern.properties : [];

  for (const property of properties) {
    if (!isAstNode(property) || property.type !== "Property") {
      continue;
    }

    if (getStaticPropertyName(property.key) !== propertyName) {
      continue;
    }

    return getBindingName(property.value);
  }

  return undefined;
}

function getBindingName(node: unknown): string | undefined {
  const identifier = getIdentifierName(node);

  if (identifier) {
    return identifier;
  }

  if (isAstNode(node) && node.type === "AssignmentPattern") {
    return getBindingName(node.left);
  }

  return undefined;
}
