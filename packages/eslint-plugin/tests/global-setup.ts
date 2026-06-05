import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export default function setup() {
  const packageRoot = fileURLToPath(new URL("..", import.meta.url));
  const pnpmPath = process.env.npm_execpath;

  if (!pnpmPath) {
    throw new Error("Cannot run eslint-plugin build because npm_execpath is not set.");
  }

  const result = spawnSync(process.execPath, [pnpmPath, "run", "build"], {
    cwd: packageRoot,
    encoding: "utf8",
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`eslint-plugin build failed with exit code ${result.status ?? "unknown"}.`);
  }
}
