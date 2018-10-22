import { getSmartContractBasePath, getSmartContractLibBasePath, normalizePath } from '@neo-one/local-browser';
import { EditorFile } from '../editor';

export type EditorFileType = 'contract' | 'javascript' | 'typescript' | 'html';

export const getFileType = (fileIn: EditorFile | string): EditorFileType | undefined => {
  const filePath = typeof fileIn === 'object' ? fileIn.path : fileIn;
  const file = normalizePath(filePath);

  if (
    file.endsWith('.one.ts') ||
    file.startsWith(getSmartContractBasePath('')) ||
    file.startsWith(getSmartContractLibBasePath(''))
  ) {
    return 'contract';
  }

  if (file.endsWith('.js') || file.endsWith('.jsx')) {
    return 'javascript';
  }

  if (file.endsWith('.ts') || file.endsWith('.tsx')) {
    return 'typescript';
  }

  if (file.endsWith('.html')) {
    return 'html';
  }

  return undefined;
};
