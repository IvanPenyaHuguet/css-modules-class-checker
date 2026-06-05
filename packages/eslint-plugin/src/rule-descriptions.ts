import type { PluginDiagnosticCode } from "./types";

export function getRuleDescription(code: PluginDiagnosticCode): string {
  switch (code) {
    case "missing-css-module-class":
      return "disallow CSS Module class usages that are not defined in the imported CSS file";
    case "unused-css-module-class":
      return "disallow CSS Module classes that are not used by the source file";
    case "raw-css-module-class":
      return "disallow using imported CSS Module classes as raw class strings";
    case "empty-css-module-selector":
      return "disallow CSS Module classes defined by empty selectors";
    case "unresolved-dynamic-class":
      return "disallow dynamic CSS Module class accesses that cannot be resolved statically";
    case "css-module-file-not-found":
      return "disallow imports of missing CSS Module files";
  }

  code satisfies never;
  throw new Error("Unknown rule code.");
}
