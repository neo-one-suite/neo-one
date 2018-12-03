// tslint:disable no-implicit-dependencies no-submodule-imports
// @ts-ignore
import coursesIn from '!../../loaders/coursesLoaderEntry!../../types';
import { Courses, SelectedChapter, SelectedCourse, SelectedLesson } from './types';

const courses: Courses = coursesIn;

export const selectCourse = (selected: SelectedCourse) => courses[selected.course];
export const selectLesson = (selected: SelectedLesson) => courses[selected.course].lessons[selected.lesson];
export const selectChapter = (selected: SelectedChapter) =>
  courses[selected.course].lessons[selected.lesson].chapters[selected.chapter];

// tslint:disable-next-line export-name
export { courses };
