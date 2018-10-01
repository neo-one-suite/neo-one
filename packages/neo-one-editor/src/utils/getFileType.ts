import { EditorFile } from '../editor';

export type EditorFileType = 'contract' | 'javascript' | 'typescript';

export const getFileType = (fileIn: EditorFile | string) => {
  const file = typeof fileIn === 'object' ? fileIn.path : fileIn;

  if (file.endsWith('.one.ts')) {
    return 'contract';
  }

  if (file.endsWith('.js') || file.endsWith('.jsx')) {
    return 'javascript';
  }

  return 'typescript';
};
