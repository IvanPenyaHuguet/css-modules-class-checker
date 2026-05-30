import path from "node:path";
import type { CheckResult, Diagnostic } from "../types.js";

export function renderTextReport(result: CheckResult, root = process.cwd()): string {
  if (result.errors.length === 0) {
    return `CSS Modules check passed. ${result.filesChecked} files checked, ${result.cssModulesChecked} CSS Modules checked.`;
  }

  const lines: string[] = [];
  const grouped = groupByFile(result.errors);

  lines.push(
    result.status === "FAIL"
      ? "CSS Modules check failed."
      : "CSS Modules check completed with warnings.",
  );

  for (const [filePath, diagnostics] of grouped) {
    lines.push("");
    lines.push(relative(root, filePath));

    for (const diagnostic of diagnostics) {
      const location = `${diagnostic.line}:${diagnostic.column}`;
      const className = diagnostic.className ? ` (${diagnostic.className})` : "";
      lines.push(`  ${diagnostic.severity} ${diagnostic.code}${className} at ${location}`);
      lines.push(`    ${diagnostic.message}`);
    }
  }

  return lines.join("\n");
}

function groupByFile(errors: Diagnostic[]): Map<string, Diagnostic[]> {
  const grouped = new Map<string, Diagnostic[]>();

  for (const error of errors) {
    const diagnostics = grouped.get(error.filePath) ?? [];
    diagnostics.push(error);
    grouped.set(error.filePath, diagnostics);
  }

  return grouped;
}

function relative(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join("/");
}
