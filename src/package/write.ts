import type { Package, PackageJsonContents, Root } from '../schema';
import yaml from 'js-yaml';
import fs from 'fs';
const yamlDumpOpts = { sortKeys: true };

export async function writeWakaRoot(
  rootFile: string,
  root: Root
): Promise<string> {
  fs.writeFileSync(rootFile, yaml.dump(root, yamlDumpOpts));
  return Promise.resolve(rootFile);
}

export async function writeWakaPackage(
  packageFile: string,
  pkg: Package
): Promise<string> {
  fs.writeFileSync(packageFile, yaml.dump(pkg, yamlDumpOpts));
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
