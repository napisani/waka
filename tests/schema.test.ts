import path from 'path';
import fs from 'fs';
import yaml from 'yaml';
import { ROOT_REGISTRY_VERSION, RootDocument } from '../src/schema';

const mockWakaRoot = path.join(__dirname, '../mocks/waka-root.yaml');
function getRootDoc() {
  const f = fs.readFileSync(mockWakaRoot, 'utf8');
  const doc = yaml.parseDocument(f);
  return RootDocument.instanceFromDocument(doc);
}
describe('PackageDocument', () => {
  let rootDocument: RootDocument;

  beforeEach(() => {
    rootDocument = getRootDoc();
  });

  describe('hasDependency', () => {
    it('should return true if dependency exists', () => {
      expect(rootDocument.hasDependency('prettier', 'devDependencies')).toBe(
        true
      );
    });

    it('should return false if dependency does not exist', () => {
      expect(rootDocument.hasDependency('axios')).toBe(false);
      expect(rootDocument.hasDependency('rxjs')).toBe(false);
    });
  });

  describe('getDependencyVersion', () => {
    it('should return the version of the dependency if it exists', () => {
      expect(
        rootDocument.getDependencyVersion('prettier', 'devDependencies')
      ).toBe(ROOT_REGISTRY_VERSION);
    });

    it('should return undefined if the dependency does not exist', () => {
      expect(rootDocument.getDependencyVersion('axios')).toBe(undefined);
      expect(rootDocument.getDependencyVersion('rxjs')).toBe(undefined);
    });
  });

  describe('setDependencyVersion', () => {
    it('should set the version of the dependency', () => {
      rootDocument.setDependencyVersion('lodash', '1.2.3');
      rootDocument.setDependencyVersion('react', '4.5.6');

      expect(rootDocument.getDependencyVersion('lodash')).toBe('1.2.3');
      expect(rootDocument.getDependencyVersion('react')).toBe('4.5.6');
    });

    it('should override the existing version of the dependency', () => {
      expect(
        rootDocument.getDependencyVersion('prettier', 'devDependencies')
      ).toBe(ROOT_REGISTRY_VERSION);

      rootDocument.setDependencyVersion('lodash', '4.5.6', 'devDependencies');

      expect(
        rootDocument.getDependencyVersion('lodash', 'devDependencies')
      ).toBe('4.5.6');
    });
  });

  describe('removeDependency', () => {
    it('should remove the dependency if it exists', () => {
      expect(rootDocument.hasDependency('prettier', 'devDependencies')).toBe(
        true
      );

      rootDocument.removeDependency('prettier', 'devDependencies');

      expect(rootDocument.hasDependency('prettier', 'devDependencies')).toBe(
        false
      );
    });

    it('should not throw error if the dependency does not exist', () => {
      expect(() => {
        rootDocument.removeDependency('axios');
      }).not.toThrow();

      expect(() => {
        rootDocument.removeDependency('rxjs');
      }).not.toThrow();
    });
  });

  describe('getDependencyNames', () => {
    it('should return an array of dependency names', () => {
      const dependencyNames = rootDocument.getDependencyNames('all');
      expect(dependencyNames.indexOf('prettier')).toBeGreaterThan(-1);
      expect(dependencyNames.indexOf('lodash')).toEqual(-1);
    });
  });
});

describe('RootDocument', () => {
  let rootDocument: RootDocument;

  beforeEach(() => {
    rootDocument = getRootDoc();
  });
  it('hasRegisteredDep', () => {
    const result = rootDocument.hasRegisteredDep('prettier');
    expect(result).toBe(true);
  });

  it('should return false if the dependency is not registered', () => {
    const result = rootDocument.hasRegisteredDep('dep3');
    expect(result).toBe(false);
  });

  it('getRegisteredDepVersion should return the version of the registered dependency', () => {
    const result = rootDocument.getRegisteredDepVersion('prettier');

    expect(result).toBe('^3.0.3');
  });

  it('getRegisteredDepVersion should return undefined if the dependency is not registered', () => {
    const result = rootDocument.getRegisteredDepVersion('dep3');
    expect(result).toBeUndefined();
  });

  it('setRegisteredDependencyVersion should set the version of the registered dependency', () => {
    rootDocument.setRegisteredDependencyVersion('prettier', '1.0.0');
    expect(rootDocument.getRegisteredDepVersion('prettier')).toBe('1.0.0');
  });

  it('removeRegisteredDependency should remove the registered dependency', () => {
    rootDocument.removeRegisteredDependency('prettier');

    expect(rootDocument.getRegisteredDepVersion('prettier')).toBeUndefined();
  });

  it('removeRegisteredDependency should do nothing if the dependency is not registered', () => {
    rootDocument.removeRegisteredDependency('dep3');
    expect(rootDocument.getRegisteredDepVersion('dep3')).toBeUndefined();
  });

  it('getRegisteredDependencyNames should return an array of registered dependency names', () => {
    const result = rootDocument.getRegisteredDependencyNames();

    expect(result.indexOf('prettier')).toBeGreaterThan(-1);
    expect(result.indexOf('lodash')).toEqual(-1);
  });
});
