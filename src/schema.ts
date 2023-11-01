import { z } from 'zod';
export const INNER_PACKAGE_REF = '*';
export const ROOT_REGISTRY_VERSION = 'root-version';

export const dependencySchema = z.string();
export type Dependency = z.infer<typeof dependencySchema>;

export const packageSchema = z.object({
  dependencies: z.record(z.string(), dependencySchema).optional(),
  devDependencies: z.record(z.string(), dependencySchema).optional(),
  peerDependencies: z.record(z.string(), dependencySchema).optional(),
  optionalDependencies: z.record(z.string(), dependencySchema).optional(),
});

export type Package = z.infer<typeof packageSchema>;

export const rootSchema = packageSchema.extend({
  rootDepRegistry: z.record(z.string(), dependencySchema),
});

export type Root = z.infer<typeof rootSchema>;

export const npmDepTypes = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;
export type NPMDepType = (typeof npmDepTypes)[number];

export interface PackageDetail {
  name: string;
  version: string;
  type: NPMDepType;
  packagePath: string;
  packageName: string;
}

export const defaultWakaPackage: Package = {
  dependencies: {},
  devDependencies: {},
  peerDependencies: {},
  optionalDependencies: {},
};

export const defaultWakaRoot: Root = {
  rootDepRegistry: {},
  dependencies: {},
  devDependencies: {},
  peerDependencies: {},
  optionalDependencies: {},
};

export interface PackageJsonContents {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}
