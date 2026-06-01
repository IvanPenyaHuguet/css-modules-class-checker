export type CheckStatus = "SUCCESS" | "FAIL";

export type RuleLevel = "off" | "warning" | "error";

export type DiagnosticCode =
  | "missing-css-module-class"
  | "unused-css-module-class"
  | "raw-css-module-class"
  | "empty-css-module-selector"
  | "unresolved-dynamic-class"
  | "css-module-file-not-found"
  | "css-parse-error"
  | "source-parse-error";

export type Diagnostic = {
  code: DiagnosticCode;
  severity: "error" | "warning";
  message: string;
  filePath: string;
  line: number;
  column: number;
  cssModulePath?: string;
  className?: string;
};

export type CheckResult = {
  status: CheckStatus;
  errors: Diagnostic[];
  filesChecked: number;
  cssModulesChecked: number;
};

export type RulesConfig = Partial<Record<DiagnosticCode, RuleLevel>>;

export type LocalsConvention =
  | "camelCase"
  | "camelCaseOnly"
  | "dashes"
  | "dashesOnly"
  | ((originalClassName: string, generatedClassName: string, inputFile: string) => string);

export type CssModuleFileMatcher = string | RegExp;

export type CheckOptions = {
  target?: string;
  ignore?: string[];
  matchFiles?: CssModuleFileMatcher[];
  ignoreClasses?: Array<string | RegExp>;
  localsConvention?: LocalsConvention;
  rules?: RulesConfig;
  typeScriptResolver?: "auto" | "off";
};

export type CssModuleNamedImport = {
  importedName: string;
  localName: string;
  index: number;
};

export type CssModuleImport = {
  localName?: string;
  namedImports: CssModuleNamedImport[];
  importPath: string;
  cssModulePath: string;
  index: number;
};

export type SourceLocation = {
  index: number;
  line: number;
  column: number;
};

export type ClassUsage =
  | {
      kind: "resolved";
      className: string;
      localName: string;
      location: SourceLocation;
      cssModulePath: string;
    }
  | {
      kind: "unresolved";
      localName: string;
      location: SourceLocation;
      cssModulePath: string;
    };
