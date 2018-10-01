// tslint:disable no-implicit-dependencies no-submodule-imports
// @ts-ignore
import coursesIn from '!../../loaders/coursesLoaderEntry!../../types';
import { Courses, SelectedChapter, SelectedLesson } from './types';

const courses: Courses = coursesIn;

export const selectLesson = (selected: SelectedLesson) => courses[selected.course].lessons[selected.lesson];
export const selectChapter = (selected: SelectedChapter) =>
  courses[selected.course].lessons[selected.lesson].chapters[selected.chapter];

export { courses };
