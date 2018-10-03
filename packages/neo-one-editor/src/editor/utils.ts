import { utils } from '@neo-one/utils';
import { getLanguageID, LanguageType } from '../monaco/language';
import { getFileType } from '../utils';
import { EditorFile } from './types';

// tslint:disable-next-line export-name
export const getLanguageIDForFile = (id: string, file: EditorFile) => {
  const type = getFileType(file);
  if (type === undefined) {
    return 'editor';
  }

  switch (type) {
    case 'contract':
      return getLanguageID(id, LanguageType.Contract);
    case 'typescript':
      return getLanguageID(id, LanguageType.TypeScript);
    case 'javascript':
      return getLanguageID(id, LanguageType.JavaScript);
    default:
      utils.assertNever(type);
      throw new Error('For TS');
  }
};
