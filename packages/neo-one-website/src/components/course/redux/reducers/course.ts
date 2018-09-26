// tslint:disable no-implicit-dependencies no-submodule-imports
// @ts-ignore
import courses from '!../../../../loaders/coursesLoaderEntry!../../types';
import { produce, setAutoFreeze } from 'immer';
import * as localforage from 'localforage';
import { persistReducer } from 'redux-persist';
import actionCreatorFactory from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { Courses, SelectedChapter, SelectedFile, SelectedLesson } from '../../types';

setAutoFreeze(false);

const actionCreator = actionCreatorFactory('INTERACTIVE');

export interface CourseState {
  readonly courses: Courses;
}

const INITIAL_STATE: CourseState = {
  courses,
};

interface UpdateFile extends SelectedFile {
  readonly content: string;
}
export const updateFile = actionCreator<UpdateFile>('UPDATE_FILE');
export const selectFile = actionCreator<SelectedFile>('SELECT_FILE');
export const completeChapter = actionCreator<SelectedChapter>('COMPLETE_CHAPTER');

const courseReducer = reducerWithInitialState(INITIAL_STATE)
  .case(updateFile, (state, { course: courseID, lesson, chapter, path, content }) =>
    produce(state, (draft) => {
      const mutableFile = draft.courses[courseID].lessons[lesson].chapters[chapter].files.find(
        (file) => file.path === path,
      );
      if (mutableFile !== undefined && mutableFile.current !== undefined) {
        mutableFile.current = content;
      }
    }),
  )
  .case(selectFile, (state, { course: courseID, lesson, chapter, path }) =>
    produce(state, (draft) => {
      const mutableFile = draft.courses[courseID].lessons[lesson].chapters[chapter].files.find(
        (file) => file.path === path,
      );
      if (mutableFile !== undefined) {
        mutableFile.selected = true;
        draft.courses[courseID].lessons[lesson].chapters[chapter].files.forEach((mutableOtherFile) => {
          if (mutableOtherFile.path !== path) {
            mutableOtherFile.selected = false;
          }
        });
      }
    }),
  )
  .case(completeChapter, (state, { course: courseID, lesson, chapter }) =>
    produce(state, (draft) => {
      draft.courses[courseID].lessons[lesson].chapters[chapter].complete = true;
      if (draft.courses[courseID].lessons[lesson].chapters.every((chap) => chap.complete)) {
        draft.courses[courseID].lessons[lesson].complete = true;
      }

      if (draft.courses[courseID].lessons.every((lessn) => lessn.complete)) {
        draft.courses[courseID].complete = true;
      }
    }),
  );

const storage = localforage.createInstance({
  name: 'course',
});

export const course = persistReducer({ key: 'course', storage }, courseReducer);

export const selectCourses = (state: CourseState) => state.courses;
export const selectLesson = (state: CourseState, selected: SelectedLesson) =>
  selectCourses(state)[selected.course].lessons[selected.lesson];
export const selectChapter = (state: CourseState, selected: SelectedChapter) =>
  selectLesson(state, selected).chapters[selected.chapter];
