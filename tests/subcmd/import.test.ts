import { importFn } from '../../src/subcmd/import';
import path from 'path';
import { exec } from 'shelljs';
import {
  getNPMPackageFile,
  getNPMPackageJsonContents,
  getWakaPackage,
  getWakaRoot,
  writePackageJson,
} from '../../src/package';
import { initFn } from '../../src';
import { ROOT_REGISTRY_VERSION } from '../../src/schema';

const mockRepoDir = path.resolve(path.join(__dirname, '../../mocks/mock-mono'));
function cleanUp() {
  exec('git restore --source=HEAD --staged --worktree --  ' + mockRepoDir);
  exec('git clean -f --  ' + mockRepoDir);
}
describe('importFn', () => {
  beforeEach(async () => {
    cleanUp();
    await initFn(mockRepoDir);
  });

  afterEach(() => {
    cleanUp();
  });

  it('importFn should import package.json contents into waka files', async () => {
    await importFn(mockRepoDir, {
      registerAll: true,
      acceptLatest: true,
    });
    const wakaRoot = await getWakaRoot(mockRepoDir);
    const wakaWebPkg = await getWakaPackage(path.join(mockRepoDir, 'apps/web'));
    expect(wakaRoot.rootDepRegistry.next).toEqual('^13.4.19');
    expect(wakaRoot.rootDepRegistry.prettier).toEqual('^3.0.3');
    expect(wakaRoot.devDependencies!.prettier).toEqual(ROOT_REGISTRY_VERSION);
    expect(wakaWebPkg.dependencies!.next).toEqual(ROOT_REGISTRY_VERSION);
    const pkgJsonContents = await getNPMPackageJsonContents(
      await getNPMPackageFile(path.join(mockRepoDir, 'apps/web'))
    );
    expect(pkgJsonContents.dependencies!.next).toEqual('^13.4.19');
  });

  it('importFn should import missing package.json contents into waka files upon second import attempt', async () => {
    await importFn(mockRepoDir, {
      registerAll: true,
      acceptLatest: true,
    });
    const webPackageJsonFile = await getNPMPackageFile(
      path.join(mockRepoDir, 'apps/web')
    );

    const pkgJsonContents = await getNPMPackageJsonContents(webPackageJsonFile);
    expect(pkgJsonContents.dependencies!.next).toEqual('^13.4.19');

    pkgJsonContents.dependencies!.glob = '10.3.10';
    await writePackageJson(webPackageJsonFile, pkgJsonContents);
    await importFn(mockRepoDir, {
      registerAll: true,
      acceptLatest: true,
    });

    const wakaRoot = await getWakaRoot(mockRepoDir);
    const wakaWebPkg = await getWakaPackage(path.join(mockRepoDir, 'apps/web'));
    expect(wakaRoot.rootDepRegistry.glob).toEqual('10.3.10');
    expect(wakaWebPkg.dependencies!.glob).toEqual(ROOT_REGISTRY_VERSION);
  });
});
