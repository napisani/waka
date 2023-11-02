import type { Document, YAMLMap } from 'yaml';
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

const rootDepRegistryKey = 'rootDepRegistry';
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

export class PackageDocument {
  public static instanceFromDocument(content: Document): PackageDocument {
    return new PackageDocument(content);
  }

  protected constructor(public content: Document) {}

  hasDependency(name: string, type: NPMDepType = 'dependencies'): boolean {
    const deps = this.content.get(type) as YAMLMap;
    return deps?.has(name) ?? false;
  }

  getDependencyVersion(
    name: string,
    type: NPMDepType = 'dependencies'
  ): string | undefined {
    const deps = this.content.get(type) as YAMLMap;
    return deps?.get(name) as string | undefined;
  }

  setDependencyVersion(
    name: string,
    version: string,
    type: NPMDepType = 'dependencies'
  ) {
    const deps: YAMLMap = this.content.get(type) as YAMLMap;
    if (!deps) {
      this.content.set(type, {});
    }
    this.content.setIn([type, name], version);
    return this;
  }

  removeDependency(name: string, type: NPMDepType = 'dependencies') {
    const deps: YAMLMap = this.content.get(type) as YAMLMap;
    if (!deps) {
      return this;
    }
    this.content.deleteIn([type, name]);
    return this;
  }

  getDependencyNames(type: NPMDepType | 'all' = 'dependencies'): string[] {
    if (type === 'all') {
      return npmDepTypes.flatMap((depType) => this.getDependencyNames(depType));
    }
    const deps: YAMLMap = this.content.get(type) as YAMLMap;
    const items =
      (deps?.items as {
        key: {
          value: string;
        };
      }[]) ?? [];
    return items.map((i) => i?.key?.value).filter((key) => !!key) ?? [];
  }

  toString() {
    return this.content.toString();
  }
}

export class RootDocument extends PackageDocument {
  public static instanceFromDocument(content: Document): RootDocument {
    return new RootDocument(content);
  }

  hasRegisteredDep(name: string): boolean {
    const deps = this.content.get(rootDepRegistryKey) as YAMLMap;
    return deps?.has(name) ?? false;
  }

  getRegisteredDepVersion(name: string): string | undefined {
    const deps = this.content.get(rootDepRegistryKey) as YAMLMap;
    return deps?.get(name) as string | undefined;
  }

  setRegisteredDependencyVersion(name: string, version: string) {
    const deps: YAMLMap = this.content.get(rootDepRegistryKey) as YAMLMap;
    if (!deps) {
      this.content.set(rootDepRegistryKey, {});
    }
    this.content.setIn([rootDepRegistryKey, name], version);
    return this;
  }

  removeRegisteredDependency(name: string) {
    const deps: YAMLMap = this.content.get(rootDepRegistryKey) as YAMLMap;
    if (!deps) {
      return this;
    }
    this.content.deleteIn([rootDepRegistryKey, name]);
    return this;
  }

  getRegisteredDependencyNames(): string[] {
    const deps: YAMLMap = this.content.get(rootDepRegistryKey) as YAMLMap;
    const items =
      (deps?.items as {
        key: {
          value: string;
        };
      }[]) ?? [];
    return items.map((i) => i?.key?.value).filter((key) => !!key) ?? [];
  }
}
