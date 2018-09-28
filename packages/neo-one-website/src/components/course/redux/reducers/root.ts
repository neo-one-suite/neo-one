import { combineReducers } from 'redux';
import { SelectedChapter, SelectedLesson } from '../../types';
import {
  course,
  CourseState,
  selectChapter as selectCourseChapter,
  selectCourses as selectCourseCourses,
  selectLesson as selectCourseLesson,
} from './course';

export const root = combineReducers({
  course,
});

export interface State {
  readonly course: CourseState;
}

export const selectCourses = (state: State) => selectCourseCourses(state.course);
export const selectLesson = (state: State, { selected }: { readonly selected: SelectedLesson }) => ({
  lesson: selectCourseLesson(state.course, selected),
});
export const selectChapter = (state: State, { selected }: { readonly selected: SelectedChapter }) => ({
  chapter: selectCourseChapter(state.course, selected),
});
export const selectChapterFile = (state: State, { selected }: { readonly selected: SelectedChapter }) => ({
  file: selectCourseChapter(state.course, selected).files.filter((file) => file.selected)[0],
});
