import { describe, expect, it } from "vitest";
import type { AstNode } from "../../src/source/ast";
import { isAstNode, walkAst } from "../../src/source/ast";
import { parseSourceFile } from "../../src/source/parse";
import { createStaticResolver } from "../../src/source/resolve-static";

describe("createStaticResolver", () => {
  it("expands template literals with multiple typed union expressions", () => {
    const resolved = resolveComputedStyleProperties(`
      import styles from "./button.module.css";

      const tone: "Primary" | "Secondary" = "Primary";
      const state: "Active" | "Disabled" = "Active";

      styles[\`button\${tone}\${state}\`];
    `);

    expect(resolved).toEqual([
      [
        "buttonPrimaryActive",
        "buttonPrimaryDisabled",
        "buttonSecondaryActive",
        "buttonSecondaryDisabled"
      ]
    ]);
  });

  it("resolves destructured prop aliases with defaults through type aliases", () => {
    const resolved = resolveComputedStyleProperties(`
      import styles from "./button.module.css";

      type Variant = "primary" | "secondary";

      export function Button({ variant: selected = "primary" }: { variant?: Variant }) {
        return styles[selected];
      }
    `);

    expect(resolved).toEqual([["primary", "secondary"]]);
  });

  it("resolves object literal maps and string enum members", () => {
    const resolved = resolveComputedStyleProperties(`
      import styles from "./button.module.css";

      const classMap = {
        primary: "primary",
        secondary: "secondary",
      } as const;

      enum Variant {
        Primary = "primary",
        Secondary = "secondary",
      }

      styles[classMap.primary];
      styles[Variant.Secondary];
    `);

    expect(resolved).toEqual([["primary"], ["secondary"]]);
  });

  it("resolves identifiers from the scope visible at the class access", () => {
    const resolved = resolveComputedStyleProperties(`
      import styles from "./button.module.css";

      const variant = "primary";

      function helper() {
        const variant = "ghost";
        return variant;
      }

      styles[variant];
    `);

    expect(resolved).toEqual([["primary"]]);
  });
});

function resolveComputedStyleProperties(source: string): string[][] {
  const parsed = parseSourceFile("fixture.tsx", source);

  if (!parsed.ok) {
    throw new Error(parsed.message);
  }

  const resolveStatic = createStaticResolver(parsed.program);
  const resolved: string[][] = [];

  walkAst(parsed.program, (node) => {
    if (!isComputedStylesMember(node)) {
      return;
    }

    const values = resolveStatic(node.property);

    if (values) {
      resolved.push(values);
    }
  });

  return resolved;
}

function isComputedStylesMember(node: AstNode): node is AstNode & { property: AstNode } {
  return (
    node.type === "MemberExpression" &&
    node.computed === true &&
    isAstNode(node.object) &&
    node.object.type === "Identifier" &&
    node.object.name === "styles" &&
    isAstNode(node.property)
  );
}
