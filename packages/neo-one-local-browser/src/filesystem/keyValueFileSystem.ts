import { removeTrailingDirectorySeparator } from '../sys';
import { sep } from './constants';
import { createEEXIST, createEISDIR, createENOENT, createENOTDIR } from './errors';
import { SimplePath } from './types';

export const normalizePath = (path: string) => {
  const result = path === '/' ? path : removeTrailingDirectorySeparator(path);

  return result.startsWith('/') ? result : `/${result}`;
};

export const readdir = (path: string, simplePath: SimplePath | undefined) => {
  if (simplePath === undefined) {
    throw createENOENT(path);
  }

  if (simplePath.type !== 'dir') {
    throw createENOTDIR(path);
  }

  return simplePath.children;
};

export const stat = (path: string, simplePath: SimplePath | undefined) => {
  if (simplePath === undefined) {
    throw createENOENT(path);
  }

  return {
    isFile: () => simplePath.type === 'file',
    isDirectory: () => simplePath.type === 'dir',
  };
};

export const readFile = (path: string, simplePath: SimplePath | undefined) => {
  if (simplePath === undefined) {
    throw createENOENT(path);
  }

  if (simplePath.type === 'dir') {
    throw createEISDIR(path);
  }

  return simplePath.content;
};

export const checkWriteFile = (path: string, simplePath: SimplePath | undefined) => {
  if (simplePath !== undefined && simplePath.type === 'dir') {
    throw createEISDIR(path);
  }
};

export const checkMkdir = (path: string, simplePath: SimplePath | undefined) => {
  if (simplePath !== undefined) {
    throw createEEXIST(path);
  }
};

export const getParentPaths = (path: string) => {
  if (path === '/') {
    return undefined;
  }

  const result = path
    .split(sep)
    .slice(0, -1)
    .join('/');

  const parentPath = result === '' ? '/' : result;
  const childPath = path.split(sep)[path.split(sep).length - 1];

  return [parentPath, childPath];
};
