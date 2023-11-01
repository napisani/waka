import fs from 'fs';
import path from 'path';
export const cwd = process.cwd();

export function toDirectoryOnly(p: string): string {
  if (fs.lstatSync(p).isDirectory()) {
    return p;
  }
  return path.dirname(p);
}

const terminalFiles = [
  'pnpm-workspace.yaml',
  'pnpm-workspace.yml',
  'pnpm-lock.yaml',
  'pnpm-lock.yml',
];
const semiTerminalFiles = ['package.json', 'node_modules', '.git'];
export function isMonoRepoRoot(dir: string) {
  const containsTerminalValue = terminalFiles.some((file) =>
    fs.existsSync(path.join(dir, file))
  );
  return containsTerminalValue;
}

export function isSubDirOfMonoRepo(dir: string) {
  const containsTerminalValue = semiTerminalFiles.some((file) =>
    fs.existsSync(path.join(dir, file))
  );
  return containsTerminalValue;
}

export function identifyRootDir(
  currntDir = cwd,
  lastProjectDir: string | null = null
) {
  if (isMonoRepoRoot(currntDir)) {
    return currntDir;
  }

  if (currntDir === path.resolve('/')) {
    throw new Error('Could not find root directory of repository');
  }

  if (!isSubDirOfMonoRepo(currntDir) && lastProjectDir) {
    return lastProjectDir;
  }
  return identifyRootDir(path.join(currntDir, '..'), currntDir);
}
// export const rootDir = identifyRootDir();
