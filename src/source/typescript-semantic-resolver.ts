import path from "node:path";

type TypeScriptModule = typeof import("typescript/lib/tsserverlibrary.js");
type ProjectService = InstanceType<TypeScriptModule["server"]["ProjectService"]>;
type SourceFile = import("typescript/lib/tsserverlibrary.js").SourceFile;
type Node = import("typescript/lib/tsserverlibrary.js").Node;
type Type = import("typescript/lib/tsserverlibrary.js").Type;

export type TypeScriptSemanticResolver = {
  resolveStringLiterals(filePath: string, start: number, end: number): string[] | undefined;
};

let resolverPromise: Promise<TypeScriptSemanticResolver | undefined> | undefined;

export async function createTypeScriptSemanticResolver(
  root: string
): Promise<TypeScriptSemanticResolver | undefined> {
  resolverPromise ??= createTypeScriptSemanticResolverInstance(root);
  return resolverPromise;
}

async function createTypeScriptSemanticResolverInstance(
  root: string
): Promise<TypeScriptSemanticResolver | undefined> {
  const ts = await loadTypeScript();

  if (!ts) {
    return undefined;
  }

  const service = createProjectService(ts, root);
  const openedFiles = new Set<string>();

  return {
    resolveStringLiterals(filePath, start, end) {
      const absolutePath = path.resolve(filePath);

      if (!openedFiles.has(absolutePath)) {
        service.openClientFile(absolutePath);
        openedFiles.add(absolutePath);
      }

      const normalizedPath = ts.server.toNormalizedPath(absolutePath);
      const project = service.getDefaultProjectForFile(normalizedPath, true);
      const program = project?.getLanguageService(true).getProgram();
      const sourceFile =
        program?.getSourceFile(normalizedPath) ?? program?.getSourceFile(absolutePath);

      if (!program || !sourceFile) {
        return undefined;
      }

      const node = findSmallestContainingNode(ts, sourceFile, start, end);

      if (!node) {
        return undefined;
      }

      const checker = program.getTypeChecker();
      const values = getStringLiteralTypeValues(ts, checker.getTypeAtLocation(node));

      return values.length > 0 ? [...new Set(values)] : undefined;
    }
  };
}

async function loadTypeScript(): Promise<TypeScriptModule | undefined> {
  try {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const specifier = ["typescript", "lib", "tsserverlibrary.js"].join("/");

    return Reflect.apply(require, undefined, [specifier]);
  } catch (error) {
    if (isMissingTypeScriptError(error)) {
      return undefined;
    }

    throw error;
  }
}

function isMissingTypeScriptError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ERR_MODULE_NOT_FOUND"
  );
}

function createProjectService(ts: TypeScriptModule, root: string): ProjectService {
  const noop = (): void => {};
  const host = {
    ...ts.sys,
    clearImmediate,
    clearTimeout,
    getCurrentDirectory: () => root,
    setImmediate,
    setTimeout,
    watchDirectory: () => ({ close: noop }),
    watchFile: () => ({ close: noop })
  };
  const logger = {
    close: noop,
    endGroup: noop,
    getLogFileName: () => undefined,
    hasLevel: () => false,
    info: noop,
    loggingEnabled: () => false,
    msg: noop,
    perftrc: noop,
    startGroup: noop
  };

  return new ts.server.ProjectService({
    cancellationToken: { isCancellationRequested: () => false },
    host,
    logger,
    session: undefined,
    typingsInstaller: ts.server.nullTypingsInstaller,
    useInferredProjectPerProjectRoot: false,
    useSingleInferredProject: false
  });
}

function findSmallestContainingNode(
  ts: TypeScriptModule,
  sourceFile: SourceFile,
  start: number,
  end: number
): Node | undefined {
  let found: Node | undefined;

  function visit(node: Node): void {
    if (node.getStart(sourceFile) <= start && end <= node.getEnd()) {
      found = node;
      ts.forEachChild(node, visit);
    }
  }

  visit(sourceFile);
  return found;
}

function getStringLiteralTypeValues(ts: TypeScriptModule, type: Type): string[] {
  if (type.isUnion()) {
    return type.types.flatMap((childType: Type) => getStringLiteralTypeValues(ts, childType));
  }

  if ((type.flags & ts.TypeFlags.StringLiteral) !== 0 && "value" in type) {
    return [String(type.value)];
  }

  if ((type.flags & ts.TypeFlags.EnumLiteral) !== 0 && "value" in type) {
    return [String(type.value)];
  }

  return [];
}
