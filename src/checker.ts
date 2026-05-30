import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { mergeRules } from "./config.js";
import { extractCssClasses } from "./css/extract-classes.js";
import { findSourceFiles } from "./files.js";
import { findCssModuleImports } from "./source/imports.js";
import { parseSourceFile } from "./source/parse.js";
import { findCssModuleClassUsages, findRawClassNameUsages } from "./source/class-usages.js";
import type {
  CheckOptions,
  CheckResult,
  Diagnostic,
  DiagnosticCode,
  RuleLevel,
  SourceLocation
} from "./types.js";

type CssModuleRecord = {
  classes: Set<string>;
  emptyClasses: Set<string>;
  locations: Map<string, SourceLocation>;
  usedClasses: Set<string>;
  hasUnresolvedUsage: boolean;
};

export async function checkCssModules(options: CheckOptions = {}): Promise<CheckResult> {
  const target = path.resolve(options.target ?? process.cwd());
  const rules = mergeRules(options.rules);
  const sourceFiles = await findSourceFiles(target, options.ignore);
  const diagnostics: Diagnostic[] = [];
  const cssModules = new Map<string, CssModuleRecord>();

  for (const filePath of sourceFiles) {
    const source = await readFile(filePath, "utf8");
    const parsedSource = parseSourceFile(filePath, source);

    if (!parsedSource.ok) {
      pushDiagnostic(diagnostics, rules, {
        code: "source-parse-error",
        message: parsedSource.message,
        filePath,
        location: parsedSource.location
      });
      continue;
    }

    const imports = findCssModuleImports(parsedSource.program, filePath);

    if (imports.length === 0) {
      continue;
    }

    let shouldAnalyzeUsages = true;

    for (const cssImport of imports) {
      if (!existsSync(cssImport.cssModulePath)) {
        pushDiagnostic(diagnostics, rules, {
          code: "css-module-file-not-found",
          message: `CSS Module file not found: ${cssImport.importPath}.`,
          filePath,
          cssModulePath: cssImport.cssModulePath,
          location: { index: cssImport.index, line: 1, column: 1 }
        });
        shouldAnalyzeUsages = false;
        continue;
      }

      if (!cssModules.has(cssImport.cssModulePath)) {
        const cssSource = await readFile(cssImport.cssModulePath, "utf8");
        const extracted = extractCssClasses(cssSource, cssImport.cssModulePath);

        if (!extracted.ok) {
          pushDiagnostic(diagnostics, rules, {
            code: "css-parse-error",
            message: extracted.message,
            filePath,
            cssModulePath: cssImport.cssModulePath,
            location: { index: cssImport.index, line: extracted.line, column: extracted.column }
          });
          shouldAnalyzeUsages = false;
          continue;
        }

        cssModules.set(cssImport.cssModulePath, {
          classes: extracted.classes,
          emptyClasses: extracted.emptyClasses,
          locations: extracted.locations,
          usedClasses: new Set(),
          hasUnresolvedUsage: false
        });
      }
    }

    if (!shouldAnalyzeUsages) {
      continue;
    }

    const moduleClassNames = new Set<string>();

    for (const cssImport of imports) {
      const cssModule = cssModules.get(cssImport.cssModulePath);

      if (!cssModule) {
        continue;
      }

      for (const className of cssModule.classes) {
        moduleClassNames.add(className);
      }
    }

    for (const usage of findCssModuleClassUsages(source, parsedSource.program, imports)) {
      if (usage.kind === "unresolved") {
        cssModules.get(usage.cssModulePath)!.hasUnresolvedUsage = true;
        pushDiagnostic(diagnostics, rules, {
          code: "unresolved-dynamic-class",
          message: `Cannot statically resolve dynamic class access on ${usage.localName}.`,
          filePath,
          cssModulePath: usage.cssModulePath,
          location: usage.location
        });
        continue;
      }

      if (isIgnoredClass(usage.className, options.ignoreClasses)) {
        continue;
      }

      const cssModule = cssModules.get(usage.cssModulePath);

      if (cssModule?.classes.has(usage.className)) {
        cssModule.usedClasses.add(usage.className);
        continue;
      }

      if (cssModule) {
        pushDiagnostic(diagnostics, rules, {
          code: "missing-css-module-class",
          message: `Class "${usage.className}" is not defined in ${path.basename(usage.cssModulePath)}.`,
          filePath,
          cssModulePath: usage.cssModulePath,
          className: usage.className,
          location: usage.location
        });
      }
    }

    for (const rawUsage of findRawClassNameUsages(source, parsedSource.program)) {
      if (
        !moduleClassNames.has(rawUsage.className) ||
        isIgnoredClass(rawUsage.className, options.ignoreClasses)
      ) {
        continue;
      }

      for (const cssImport of imports) {
        const cssModule = cssModules.get(cssImport.cssModulePath);

        if (cssModule?.classes.has(rawUsage.className)) {
          cssModule.usedClasses.add(rawUsage.className);
        }
      }

      pushDiagnostic(diagnostics, rules, {
        code: "raw-css-module-class",
        message: `CSS Module class "${rawUsage.className}" is used as a raw class string.`,
        filePath,
        className: rawUsage.className,
        location: rawUsage.location
      });
    }
  }

  for (const [cssModulePath, cssModule] of cssModules) {
    if (options.reportEmptySelectors !== false) {
      for (const className of cssModule.emptyClasses) {
        if (isIgnoredClass(className, options.ignoreClasses)) {
          continue;
        }

        pushDiagnostic(diagnostics, rules, {
          code: "empty-css-module-selector",
          message: `Class "${className}" is defined by an empty selector in ${path.basename(
            cssModulePath
          )}.`,
          filePath: cssModulePath,
          cssModulePath,
          className,
          location: cssModule.locations.get(className) ?? { index: 0, line: 1, column: 1 }
        });
      }
    }

    if (cssModule.hasUnresolvedUsage) {
      continue;
    }

    for (const className of cssModule.classes) {
      if (
        cssModule.usedClasses.has(className) ||
        isIgnoredClass(className, options.ignoreClasses)
      ) {
        continue;
      }

      pushDiagnostic(diagnostics, rules, {
        code: "unused-css-module-class",
        message: `Class "${className}" is defined in ${path.basename(cssModulePath)} but is never used.`,
        filePath: cssModulePath,
        cssModulePath,
        className,
        location: cssModule.locations.get(className) ?? { index: 0, line: 1, column: 1 }
      });
    }
  }

  return {
    status: diagnostics.some((diagnostic) => diagnostic.severity === "error") ? "FAIL" : "SUCCESS",
    errors: diagnostics,
    filesChecked: sourceFiles.length,
    cssModulesChecked: cssModules.size
  };
}

function pushDiagnostic(
  diagnostics: Diagnostic[],
  rules: Record<DiagnosticCode, RuleLevel>,
  input: {
    code: DiagnosticCode;
    message: string;
    filePath: string;
    location: SourceLocation;
    cssModulePath?: string;
    className?: string;
  }
): void {
  const level = rules[input.code];

  if (level === "off") {
    return;
  }

  diagnostics.push({
    code: input.code,
    severity: level,
    message: input.message,
    filePath: input.filePath,
    line: input.location.line,
    column: input.location.column,
    cssModulePath: input.cssModulePath,
    className: input.className
  });
}

function isIgnoredClass(className: string, ignoreClasses: CheckOptions["ignoreClasses"]): boolean {
  return (ignoreClasses ?? []).some((ignoredClass) => {
    if (typeof ignoredClass === "string") {
      return ignoredClass === className;
    }

    return ignoredClass.test(className);
  });
}
