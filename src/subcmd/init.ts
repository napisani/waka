import fs from 'fs';
import path from 'path';
import {
  getAllPackageDirectories,
  getWakaPackageFile,
  getWakaRootFile,
  writeWakaPackage,
  writeWakaRoot,
} from '../package';
import type { Package, Root } from '../schema';
import { defaultWakaPackage, defaultWakaRoot } from '../schema';

async function generateRootWakaFile(cwd: string) {
  const rootFile = await getWakaRootFile(cwd);
  if (fs.existsSync(rootFile)) {
    console.log(`Root file already exists: ${rootFile} -- skipping`);
    return rootFile;
  }
  const root: Root = defaultWakaRoot;
  await writeWakaRoot(rootFile, root);
  return rootFile;
}

async function generatePackageWakaFile(cwd: string, packageDir: string) {
  const pkgFile = await getWakaPackageFile(path.join(cwd, packageDir));
  if (fs.existsSync(pkgFile)) {
    console.log(`Package file already exists: ${pkgFile} -- skipping`);
    return pkgFile;
  }
  const pkg: Package = defaultWakaPackage;
  await writeWakaPackage(pkgFile, pkg);
  return pkgFile;
}

export async function initFn(cwd: string) {
  const rootFile = await generateRootWakaFile(cwd);
  const packageDirs = await getAllPackageDirectories(cwd, {
    includeRoot: false,
  });
  const pkgFiles = await Promise.all(
    packageDirs.map(async (p) => {
      await generatePackageWakaFile(cwd, p);
    })
  );

  console.log(
    `Initialized waka yaml files \nroot: ${rootFile} \npackages: ${pkgFiles.join(
      '\n'
    )}`
  );
}
