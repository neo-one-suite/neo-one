import { EditorFile } from '../editor';
import { getFileType } from './getFileType';

export const getFileTypeName = (file: EditorFile) => {
  const type = getFileType(file);

  const major = type === 'typescript' || type === 'contract' ? 'TypeScript' : 'JavaScript';

  if (file.path.endsWith('x')) {
    return `${major} React`;
  }

  if (file.path.includes('.one')) {
    return `${major} Contract`;
  }

  return major;
};
