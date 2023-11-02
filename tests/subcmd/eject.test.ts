import path from 'path';
import fs from 'fs';
import { exec } from 'shelljs';
import { initFn, installFn } from '../../src';
import {
  getWakaPackage,
  getWakaPackageFiles,
  getWakaRoot,
} from '../../src/package';
import { ROOT_REGISTRY_VERSION } from '../../src/schema';
import { importFn } from '../../src/subcmd/import';
import { ejectFn } from '../../src/subcmd/eject';

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

  it('eject with confirmation deletes all waka files', async () => {
    await ejectFn(mockRepoDir, { confirm: true });
    const allFiles = await getWakaPackageFiles(mockRepoDir, {
      includeRoot: true,
      ensureExists: false,
    });

    expect(
      allFiles
        .map((f) => fs.existsSync(f))
        .reduce((acc, next) => {
          return acc || next;
        }, false)
    ).toEqual(false);
  });

  it('eject without confirmation does not delete files', async () => {
    await ejectFn(mockRepoDir, { confirm: false });
    const allFiles = await getWakaPackageFiles(mockRepoDir, {
      includeRoot: true,
      ensureExists: false,
    });

    expect(
      allFiles
        .map((f) => fs.existsSync(f))
        .reduce((acc, next) => {
          return acc && next;
        }, true)
    ).toEqual(true);
  });
});
