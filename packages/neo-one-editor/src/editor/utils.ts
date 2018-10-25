import { utils } from '@neo-one/utils';
import { LanguageID } from '../monaco/language';
import { getFileType } from '../utils';
import { EditorFile } from './types';

// tslint:disable-next-line export-name
export const getLanguageIDForFile = (file: EditorFile) => {
  const type = getFileType(file);
  if (type === undefined) {
    return 'editor';
  }

  switch (type) {
    case 'contract':
      return LanguageID.Contract;
    case 'typescript':
      return LanguageID.TypeScript;
    case 'javascript':
      return LanguageID.JavaScript;
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    default:
      utils.assertNever(type);
      throw new Error('For TS');
  }
};
