import { describe, expect, it } from "vitest";
import { walkAst } from "../../src/source/ast";

describe("AST walker", () => {
  it("ignores non-AST input", () => {
    const visited: string[] = [];

    walkAst(undefined, (node) => {
      visited.push(String(node.type));
    });

    expect(visited).toEqual([]);
  });

  it("walks child nodes without following parent links", () => {
    const parent = { type: "Program", body: [] as unknown[] };
    const child = { type: "ExpressionStatement", parent };
    parent.body.push(child);
    const visited: Array<{ type: string | undefined; ancestors: number }> = [];

    walkAst(parent, (node, ancestors) => {
      visited.push({ type: node.type, ancestors: ancestors.length });
    });

    expect(visited).toEqual([
      { type: "Program", ancestors: 0 },
      { type: "ExpressionStatement", ancestors: 1 }
    ]);
  });
});
