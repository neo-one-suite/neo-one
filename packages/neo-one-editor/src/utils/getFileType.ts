import { EditorFile } from '../editor';

export type EditorFileType = 'contract' | 'javascript' | 'typescript';

export const getFileType = (fileIn: EditorFile | string): EditorFileType | undefined => {
  const file = typeof fileIn === 'object' ? fileIn.path : fileIn;

  if (file.endsWith('.one.ts')) {
    return 'contract';
  }

  if (file.endsWith('.js') || file.endsWith('.jsx')) {
    return 'javascript';
  }

  if (file.endsWith('.ts') || file.endsWith('.tsx')) {
    return 'typescript';
  }

  return undefined;
};
