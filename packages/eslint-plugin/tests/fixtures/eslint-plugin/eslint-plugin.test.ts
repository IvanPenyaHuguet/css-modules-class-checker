import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";
import { configs } from "../../../src/index";

const fixtureRoot = path.dirname(fileURLToPath(import.meta.url));

describe("eslint plugin fixture", () => {
  it("reports recommended diagnostics through the ESLint API", async () => {
    const messages = await runEslint([
      "src/profile.tsx",
      "src/raw-class.tsx",
      "src/unused-class.tsx",
      "src/missing-file.tsx"
    ]);

    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "@stale-styles/missing-css-module-class",
          message: expect.stringContaining('Class "ghost" is not defined in profile.module.css.')
        }),
        expect.objectContaining({
          ruleId: "@stale-styles/unused-css-module-class",
          message: expect.stringContaining(
            'Class "archived" is defined in unused-class.module.css but is never used.'
          )
        }),
        expect.objectContaining({
          ruleId: "@stale-styles/raw-css-module-class",
          message: expect.stringContaining('CSS Module class "pill" is used as a raw class string.')
        }),
        expect.objectContaining({
          ruleId: "@stale-styles/empty-css-module-selector",
          message: expect.stringContaining(
            'Class "placeholder" is defined by an empty selector in profile.module.css.'
          )
        }),
        expect.objectContaining({
          ruleId: "@stale-styles/unresolved-dynamic-class",
          message: expect.stringContaining(
            "Cannot statically resolve dynamic class access on styles."
          )
        }),
        expect.objectContaining({
          ruleId: "@stale-styles/css-module-file-not-found",
          message: expect.stringContaining("CSS Module file not found: ./missing-card.module.css.")
        })
      ])
    );
  });

  it("honors ESLint disable comments for individual stale-styles diagnostics", async () => {
    const messages = await runEslint(["src/disabled.tsx"]);

    expect(messages).toEqual([
      expect.objectContaining({
        ruleId: "@stale-styles/missing-css-module-class",
        message: expect.stringContaining(
          'Class "visibleMissing" is not defined in disabled.module.css.'
        )
      }),
      expect.objectContaining({
        ruleId: "@stale-styles/raw-css-module-class",
        message: expect.stringContaining(
          'CSS Module class "visibleRaw" is used as a raw class string.'
        )
      })
    ]);
  });

  it("reports unused classes when only unresolved dynamic access is disabled inline", async () => {
    const messages = await runEslint(["src/disabled-unresolved-keeps-unused.tsx"]);

    expect(messages).toEqual([
      expect.objectContaining({
        ruleId: "@stale-styles/unused-css-module-class",
        message: expect.stringContaining(
          'Class "orphan" is defined in disabled-unresolved-keeps-unused.module.css but is never used.'
        )
      })
    ]);
  });
});

async function runEslint(files: string[]) {
  const eslint = new ESLint({
    cwd: fixtureRoot,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ["**/*.tsx"],
        plugins: configs.recommended.plugins,
        rules: configs.recommended.rules,
        languageOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
          parserOptions: {
            ecmaFeatures: {
              jsx: true
            }
          }
        }
      }
    ]
  });

  const results = await eslint.lintFiles(files);
  return results.flatMap((result) => result.messages);
}
