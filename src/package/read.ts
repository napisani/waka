import {
  parsePackageSelector,
  readProjects,
} from '@pnpm/filter-workspace-packages';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { npmDepTypes, packageSchema, rootSchema } from '../schema';
import type {
  NPMDepType,
  Package,
  PackageDetail,
  PackageJsonContents,
  Root,
} from '../schema';
const packageDirToNameCache = new Map<string, string>();
const packageNameToDirCache = new Map<string, string>();

function toDirectoryOnly(p: string): string {
  if (fs.existsSync(p) === false) {
    throw new Error(`Path ${p} does not exist.`);
  }

  if (fs.lstatSync(p).isDirectory()) {
    return p;
  }
  return path.dirname(p);
}

export async function getPackagePathsFromPnpmSelector(
  selector: string,
  cwd: string
): Promise<string[]> {
  const projects = await readProjects(cwd, [
    parsePackageSelector(selector, cwd),
  ]);
  return Object.keys(projects.selectedProjectsGraph).map((p) =>
    path.relative(cwd, p).replaceAll('\\', '/')
  );
}

export async function getNPMPackageDir(
  packageName: string,
  cwd: string
): Promise<string> {
  if (packageNameToDirCache.has(packageName)) {
    return packageNameToDirCache.get(packageName)!;
  }
  const packageDirRelative = await getPackagePathsFromPnpmSelector(
    packageName,
    cwd
  );
  if (!packageDirRelative || packageDirRelative.length === 0) {
    throw new Error(`Package ${packageName} does not exist.`);
  }
  const dir = toDirectoryOnly(path.join(cwd, packageDirRelative[0]!));
  const packageDir = path.resolve(dir);
  packageNameToDirCache.set(packageName, packageDir);
  packageDirToNameCache.set(packageDir, packageName);
  return packageDir;
}

export function getNPMPackageName(packageJsonFile: string): string {
  const fullPath = path.resolve(packageJsonFile);
  const dir = toDirectoryOnly(fullPath);
  if (packageDirToNameCache.has(dir)) {
    return packageDirToNameCache.get(dir)!;
  }
  const rawData = fs.readFileSync(fullPath, 'utf8');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pkgJsonData: Record<string, any> = JSON.parse(rawData) as Record<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >;
  const pkgName = pkgJsonData.name as string;
  packageDirToNameCache.set(dir, pkgName);
  packageNameToDirCache.set(pkgName, dir);
  return pkgName;
}

export async function getAllPackageDirectories(
  cwd: string,
  opts?: { includeRoot: boolean }
) {
  const packageDirs = await getPackagePathsFromPnpmSelector('*', cwd);
  if (opts?.includeRoot === false) {
    return packageDirs.filter((p) => p !== '' && p !== '.' && p !== './');
  }
  return packageDirs;
}

async function getPackageFile(
  filename: string,
  packageDir: string,
  opts?: { ensureExists?: boolean }
): Promise<string> {
  const f = path.join(packageDir, filename);
  if (opts?.ensureExists && !fs.existsSync(f)) {
    throw new Error(`File ${f} does not exist.`);
  }
  return Promise.resolve(f);
}

export async function getWakaPackageFile(
  packageDir: string,
  opts?: { ensureExists?: boolean }
): Promise<string> {
  packageDir = toDirectoryOnly(packageDir);
  return getPackageFile('waka-package.yaml', packageDir, opts);
}

export async function getNPMPackageFile(
  packageDir: string,
  opts?: { ensureExists?: boolean }
): Promise<string> {
  packageDir = toDirectoryOnly(packageDir);
  return getPackageFile('package.json', packageDir, opts);
}

export function getWakaRootFile(
  cwd: string,
  opts?: { ensureExists?: boolean }
): Promise<string> {
  const rootFile = path.join(cwd, 'waka-root.yaml');
  if (opts?.ensureExists && !fs.existsSync(rootFile)) {
    throw new Error(`File ${rootFile} does not exist.`);
  }
  return Promise.resolve(rootFile);
}

export async function getWakaPackageFiles(
  cwd: string,
  opts?: { ensureExists?: boolean; includeRoot?: boolean }
) {
  const packageDirs = await getAllPackageDirectories(cwd, {
    includeRoot: false,
  });
  const pkgFilePromises = packageDirs.map(async (p) => {
    const f = await getWakaPackageFile(path.join(cwd, p), opts);
    return f;
  });
  const allPackageFiles = await Promise.all(pkgFilePromises);
  if (opts?.includeRoot) {
    const rootFile = await getWakaRootFile(cwd, {
      ensureExists: opts?.ensureExists,
    });
    allPackageFiles.push(rootFile);
  }
  return allPackageFiles.filter((f) => !!f);
}

export async function getNPMPackageFiles(
  cwd: string,
  opts?: { ensureExists?: boolean; includeRoot?: boolean }
) {
  const packageDirs = await getAllPackageDirectories(cwd, {
    includeRoot: opts?.includeRoot ?? false,
  });
  const pkgFilePromises = packageDirs.map(async (p) => {
    const f = await getNPMPackageFile(path.join(cwd, p), opts);
    return f;
  });
  return (await Promise.all(pkgFilePromises)).filter((f) => !!f);
}

export async function getNPMPackageJsonContents(packageDir: string) {
  packageDir = toDirectoryOnly(packageDir);
  const fullPath = await getNPMPackageFile(packageDir, { ensureExists: true });
  const rawData = fs.readFileSync(fullPath, 'utf8');

  const pkgJsonData: PackageJsonContents = JSON.parse(
    rawData
  ) as PackageJsonContents;
  return pkgJsonData;
}

export function getRootNPMPackageFile(
  cwd: string,
  opts?: { ensureExists: boolean }
): Promise<string> {
  const rootFile = path.join(cwd, 'package.json');
  if (opts?.ensureExists && !fs.existsSync(rootFile)) {
    throw new Error(`File ${rootFile} does not exist.`);
  }
  return Promise.resolve(rootFile);
}

export async function getWakaRoot(cwd: string): Promise<Root> {
  const rootFile = await getWakaRootFile(cwd, { ensureExists: true });
  const rawData = fs.readFileSync(rootFile, 'utf8');
  const root = yaml.load(rawData);
  const rootParsed = rootSchema.parse(root);
  return rootParsed;
}

export async function getWakaPackage(
  packageDirectory: string
): Promise<Package> {
  const packageDir = toDirectoryOnly(packageDirectory);
  const wakaPackageFile = await getWakaPackageFile(packageDir, {
    ensureExists: true,
  });
  const rawData = fs.readFileSync(wakaPackageFile, 'utf8');
  const pkg = yaml.load(rawData);
  const pkgParsed = packageSchema.parse(pkg);
  return pkgParsed;
}
export async function getWakaPackages(
  cwd: string
): Promise<Record<string, Package>> {
  const packageFiles = await getWakaPackageFiles(cwd, { ensureExists: true });
  return (
    await Promise.all<Record<string, Package>>(
      packageFiles.map(async (p) => {
        const packageDir = path.dirname(p);
        const packageJsonFile = await getNPMPackageFile(packageDir, {
          ensureExists: true,
        });
        const packageName = getNPMPackageName(packageJsonFile);
        const pkgParsed = await getWakaPackage(packageDir);
        return { [packageName]: pkgParsed };
      })
    )
  ).reduce((acc, p) => {
    return { ...acc, ...p };
  }, {});
}

export async function getNPMPackageDetails(
  cwd: string,
  opts?: { includeRoot: boolean }
) {
  const pkgJsons = await getNPMPackageFiles(cwd, {
    ensureExists: true,
    includeRoot: false,
  });
  if (opts?.includeRoot) {
    const rootPkgJsons = await getRootNPMPackageFile(cwd, {
      ensureExists: true,
    });
    pkgJsons.push(rootPkgJsons);
  }
  const promises = pkgJsons.flatMap(async (p) => {
    const details: PackageDetail[] = [];
    const pkgJsonData = await getNPMPackageJsonContents(p);
    npmDepTypes.forEach((depType: NPMDepType) => {
      const deps = pkgJsonData[depType];
      if (deps) {
        Object.keys(deps).forEach((depName) => {
          details.push({
            name: depName,
            version: deps[depName]!,
            type: depType,
            packagePath: p,
            packageName: getNPMPackageName(p),
          });
        });
      }
    });
    return details;
  });
  return (await Promise.all(promises)).flat();
}
export function getDetailKey(
  detail: PackageDetail,
  mapBy: (keyof PackageDetail)[] = ['name']
) {
  return mapBy.map((mapByKey) => detail[mapByKey]).join('|');
}
export function mapNPMPackageDetails(
  details: PackageDetail[],
  mapBy: (keyof PackageDetail)[] = ['name']
): Record<string, PackageDetail[]> {
  const m = details.reduce(
    (acc, pkgDetail) => {
      const fullKey = getDetailKey(pkgDetail, mapBy);
      if (!acc[fullKey]) {
        acc[fullKey] = [];
      }
      acc[fullKey]!.push(pkgDetail);
      return acc;
    },
    {} as Record<string, PackageDetail[]>
  );
  return m;
}
