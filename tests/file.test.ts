import fs from 'fs';
import path from 'path';

import { toDirectoryOnly, isMonoRepoRoot, identifyRootDir } from '../src/file';

const mockRepoDir = path.resolve(path.join(__dirname, '../mocks/mock-mono'));
describe('toDirectoryOnly', () => {
  it('should return the input path if it is a directory', () => {
    const result = toDirectoryOnly(mockRepoDir);
    expect(result).toBe(mockRepoDir);
  });

  it('should return the directory of the input file path if it is not a directory', () => {
    const result = toDirectoryOnly(path.join(mockRepoDir, 'package.json'));
    expect(result).toBe(mockRepoDir);
  });
});

describe('isMonoRepoRoot', () => {
  it('should return true if the directory contains any of the terminal files', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);

    const result = isMonoRepoRoot(mockRepoDir);
    expect(result).toBe(true);
  });

  it('should return false if the directory does not contain any of the terminal files', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const result = isMonoRepoRoot(path.join(mockRepoDir, 'packages'));
    expect(result).toBe(false);
  });
});

describe('identifyRootDir', () => {
  it('should return the current directory if it is the root of the monorepo', () => {
    const result = identifyRootDir(mockRepoDir);
    expect(result).toBe(mockRepoDir);
  });

  it('should throw an error if the current directory is the root of the file system', () => {
    expect(() => identifyRootDir('/')).toThrow(
      'Could not find root directory of repository'
    );
  });

  // it('should recursively search for the root directory starting from the current directory', () => {
  //   jest
  //     .spyOn(fs, 'existsSync')
  //     .mockReturnValueOnce(false)
  //     .mockReturnValueOnce(true);

  //   const result = identifyRootDir('/path/to/repo/nested');
  //   expect(result).toBe('/path/to/repo');
  // });

  // it('should return null if no root directory is found and lastProjectDir is null', () => {
  //   jest.spyOn(fs, 'existsSync').mockReturnValue(false);

  //   const result = identifyRootDir('/path/to/repo');
  //   expect(result).toBeNull();
  // });

  // it('should return lastProjectDir if no root directory is found', () => {
  //   jest.spyOn(fs, 'existsSync').mockReturnValue(false);

  //   const result = identifyRootDir('/path/to/repo', '/path/to/last');
  //   expect(result).toBe('/path/to/last');
  // });
});
