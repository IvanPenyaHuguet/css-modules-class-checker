export type CheckStatus = "SUCCESS" | "FAIL";

export type RuleLevel = "off" | "warning" | "error";

export type DiagnosticCode =
  | "missing-css-module-class"
  | "raw-css-module-class"
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

export type CheckOptions = {
  target?: string;
  ignore?: string[];
  ignoreClasses?: Array<string | RegExp>;
  rules?: RulesConfig;
};

export type CssModuleImport = {
  localName: string;
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
