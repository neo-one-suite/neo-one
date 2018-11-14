import { selectChapter } from '../coursesData';
import { SelectedChapter } from '../types';

// tslint:disable-next-line export-name
export const enablePreview = (selected: SelectedChapter) =>
  selectChapter(selected).files.some((file) => file.path === 'public/index.html');
