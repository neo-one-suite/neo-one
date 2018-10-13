import { createEACCES, createEEXIST, createEISDIR, createENOENT, createENOTDIR } from './errors';
import { SimplePath } from './types';

export const normalizePath = (path: string) => {
  const result = path === '/' ? path : path.endsWith('/') ? path.slice(0, -1) : path;

  return result.startsWith('/') ? result : `/${result}`;
};

export const readdir = (pathIn: string, simplePath: SimplePath | undefined) => {
  const path = normalizePath(pathIn);
  if (simplePath === undefined) {
    throw createENOENT(path);
  }

  if (simplePath.type !== 'dir') {
    throw createENOTDIR(path);
  }

  return simplePath.children;
};

export const stat = (pathIn: string, simplePath: SimplePath | undefined) => {
  const path = normalizePath(pathIn);
  if (simplePath === undefined) {
    throw createENOENT(path);
  }

  return {
    isFile: () => simplePath.type === 'file',
    isDirectory: () => simplePath.type === 'dir',
  };
};

const readSimpleFile = (pathIn: string, simplePath: SimplePath | undefined) => {
  const path = normalizePath(pathIn);
  if (simplePath === undefined) {
    throw createENOENT(path);
  }

  if (simplePath.type === 'dir') {
    throw createEISDIR(path);
  }

  return simplePath;
};

export const readFile = (pathIn: string, simplePath: SimplePath | undefined) => {
  const path = normalizePath(pathIn);
  const simpleFile = readSimpleFile(path, simplePath);

  return simpleFile.content;
};

export const readFileOpts = (pathIn: string, simplePath: SimplePath | undefined) => {
  const path = normalizePath(pathIn);
  const simpleFile = readSimpleFile(path, simplePath);

  return simpleFile.opts;
};

export const checkWriteFile = (pathIn: string, simplePath: SimplePath | undefined) => {
  const path = normalizePath(pathIn);
  if (simplePath !== undefined && simplePath.type === 'dir') {
    throw createEISDIR(path);
  }

  if (simplePath !== undefined && !simplePath.opts.writable) {
    throw createEACCES(path);
  }

  return simplePath;
};

export const checkMkdir = (pathIn: string, simplePath: SimplePath | undefined) => {
  const path = normalizePath(pathIn);
  if (simplePath !== undefined) {
    throw createEEXIST(path);
  }
};

export const getParentPaths = (pathIn: string) => {
  const path = normalizePath(pathIn);
  if (path === '/') {
    return undefined;
  }

  const result = path
    .split('/')
    .slice(0, -1)
    .join('/');

  const parentPath = result === '' ? '/' : result;
  const childPath = path.split('/')[path.split('/').length - 1];

  return [parentPath, childPath];
};
