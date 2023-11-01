import { basename, dirname } from 'path';
export function getProjectNameByProjectFile(f: string): string {
  const projectPath = dirname(f);
  const projectName = basename(projectPath);
  return projectName;
}
