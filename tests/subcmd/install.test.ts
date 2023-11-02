import path from 'path';
import { exec } from 'shelljs';
import { initFn, installFn } from '../../src';
import { getWakaPackage, getWakaRoot } from '../../src/package';
import { ROOT_REGISTRY_VERSION } from '../../src/schema';
import { importFn } from '../../src/subcmd/import';

const mockRepoDir = path.resolve(path.join(__dirname, '../../mocks/mock-mono'));
function cleanUp() {
  exec('git restore --source=HEAD --staged --worktree --  ' + mockRepoDir);
  exec('git clean -f --  ' + mockRepoDir);
}
describe('importFn', () => {
  beforeEach(async () => {
    cleanUp();
    await initFn(mockRepoDir);
    await importFn(mockRepoDir, {
      registerAll: true,
      acceptLatest: true,
    });
  });

  afterEach(() => {
    cleanUp();
  });

  it('install package (not in the root registry), with a specific version, within web app', async () => {
    await installFn(mockRepoDir, {
      packageName: 'lodash@4.17.20',
      workspace: 'web',
    });

    const wakaPackage = await getWakaPackage(
      path.join(mockRepoDir, 'apps/web')
    );
    const wakaRoot = await getWakaRoot(mockRepoDir);
    expect(wakaRoot.rootDepRegistry.lodash).toEqual('4.17.20');
    expect(wakaPackage.dependencies!.lodash).toEqual(ROOT_REGISTRY_VERSION);
  });

  it('install package (not in the root registry), with a specific version, within web app, saveDev', async () => {
    await installFn(mockRepoDir, {
      packageName: 'lodash@4.17.20',
      workspace: 'web',
      saveDev: true,
    });

    const wakaPackage = await getWakaPackage(
      path.join(mockRepoDir, 'apps/web')
    );
    const wakaRoot = await getWakaRoot(mockRepoDir);
    expect(wakaRoot.rootDepRegistry.lodash).toEqual('4.17.20');
    expect(wakaPackage.devDependencies!.lodash).toEqual(ROOT_REGISTRY_VERSION);
  });

  it('install package (not in the root registry), with a specific version, within web app, savePeer', async () => {
    await installFn(mockRepoDir, {
      packageName: 'lodash@4.17.20',
      workspace: 'web',
      savePeer: true,
    });

    const wakaPackage = await getWakaPackage(
      path.join(mockRepoDir, 'apps/web')
    );
    const wakaRoot = await getWakaRoot(mockRepoDir);
    expect(wakaRoot.rootDepRegistry.lodash).toEqual('4.17.20');
    expect(wakaPackage.peerDependencies!.lodash).toEqual(ROOT_REGISTRY_VERSION);
  });

  it('install package (not in the root registry), with a specific version, within web app, saveOpt', async () => {
    await installFn(mockRepoDir, {
      packageName: 'lodash@4.17.20',
      workspace: 'web',
      saveOpt: true,
    });

    const wakaPackage = await getWakaPackage(
      path.join(mockRepoDir, 'apps/web')
    );
    const wakaRoot = await getWakaRoot(mockRepoDir);
    expect(wakaRoot.rootDepRegistry.lodash).toEqual('4.17.20');
    expect(wakaPackage.optionalDependencies!.lodash).toEqual(
      ROOT_REGISTRY_VERSION
    );
  });

  it('install package (not in the root registry), with a specific version, within web app, noRegister', async () => {
    await installFn(mockRepoDir, {
      packageName: 'lodash@4.17.20',
      workspace: 'web',
      noRegister: true,
    });

    const wakaPackage = await getWakaPackage(
      path.join(mockRepoDir, 'apps/web')
    );
    const wakaRoot = await getWakaRoot(mockRepoDir);
    expect(wakaRoot.rootDepRegistry.lodash).toBeFalsy();
    expect(wakaPackage.dependencies!.lodash).toEqual('4.17.20');
  });

  it('install package (not in the root registry), with a specific version, within root', async () => {
    await installFn(mockRepoDir, {
      packageName: 'lodash@4.17.20',
    });
    const wakaRoot = await getWakaRoot(mockRepoDir);
    expect(wakaRoot.rootDepRegistry.lodash).toEqual('4.17.20');
    expect(wakaRoot.dependencies!.lodash).toEqual(ROOT_REGISTRY_VERSION);
  });

  it('install package (prexisting in registry), with a specific version, within root - should throw error', async () => {
    await expect(() =>
      installFn(mockRepoDir, {
        packageName: 'prettier@^4.0.0',
      })
    ).rejects.toThrow(Error);
  });

  it('install package (prexisting in registry), with a specific version, within root, no register', async () => {
    await installFn(mockRepoDir, {
      packageName: 'prettier@^4.0.0',
      noRegister: true,
      saveDev: true,
    });
    const wakaRoot = await getWakaRoot(mockRepoDir);
    expect(wakaRoot.rootDepRegistry.prettier).toEqual('^3.0.3');
    expect(wakaRoot.devDependencies!.prettier).toEqual('^4.0.0');
  });
});
