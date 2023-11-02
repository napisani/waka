import type {
  Package,
  PackageDocument,
  PackageJsonContents,
  Root,
  RootDocument,
} from '../schema';
import yaml from 'yaml';
import fs from 'fs';
// const yamlDumpOpts = { sortKeys: true };

export async function writeWakaRoot(
  rootFile: string,
  root: Root
): Promise<string> {
  fs.writeFileSync(rootFile, yaml.stringify(root));
  return Promise.resolve(rootFile);
}

export async function writeWakaPackage(
  packageFile: string,
  pkg: Package
): Promise<string> {
  fs.writeFileSync(packageFile, yaml.stringify(pkg));
  return Promise.resolve(packageFile);
}

export async function writePackageJson(
  packageJsonFile: string,
  packageJsonContents: PackageJsonContents
): Promise<string> {
  fs.writeFileSync(
    packageJsonFile,
    JSON.stringify(packageJsonContents, null, 2)
  );
  return Promise.resolve(packageJsonFile);
}

export async function writeWakaRootDocument(
  rootFile: string,
  root: RootDocument
): Promise<string> {
  fs.writeFileSync(rootFile, root.toString());
  return Promise.resolve(rootFile);
}

export async function writeWakaPackageDocument(
  packageFile: string,
  pkg: PackageDocument
): Promise<string> {
  fs.writeFileSync(packageFile, pkg.toString());
  return Promise.resolve(packageFile);
}
