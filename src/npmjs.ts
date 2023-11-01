import { exec } from 'shelljs';
export function getLatestVersion(packageName: string) {
  const { stdout } = exec(`npm view ${packageName} version`);
  return stdout.trim();
}
