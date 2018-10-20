import { produce, setAutoFreeze } from 'immer';
import localforage from 'localforage';
import LogRocket from 'logrocket';
import { applyMiddleware, createStore } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import actionCreatorFactory from 'typescript-fsa';
import { reducerWithInitialState } from 'typescript-fsa-reducers';

const actionCreator = actionCreatorFactory();
setAutoFreeze(false);

export interface ChaptersProgress {
  readonly [chapter: number]: boolean;
}

export interface LessonsProgress {
  readonly [lesson: number]: ChaptersProgress;
}

export interface CoursesProgress {
  readonly [course: string]: LessonsProgress;
}

export interface CourseState {
  readonly progress: CoursesProgress;
}

const INITIAL_STATE: CourseState = {
  progress: {},
};

interface CourseProp {
  readonly course: string;
}

interface LessonProp extends CourseProp {
  readonly lesson: number;
}

interface ChapterProp extends LessonProp {
  readonly chapter: number;
}

export const completeChapter = actionCreator<ChapterProp>('COMPLETE_CHAPTER');

const reducer = reducerWithInitialState(INITIAL_STATE).case(completeChapter, (state, { course, lesson, chapter }) =>
  produce(state, (draft) => {
    if ((draft.progress[course] as LessonsProgress | undefined) === undefined) {
      draft.progress[course] = {};
    }

    if ((draft.progress[course][lesson] as ChaptersProgress | undefined) === undefined) {
      draft.progress[course][lesson] = {};
    }

    draft.progress[course][lesson][chapter] = true;
  }),
);

const storage = localforage.createInstance({
  name: 'neo-one-course',
});

export const configureStore = () => {
  const store = createStore(
    persistReducer({ key: 'root', storage }, reducer),
    applyMiddleware(LogRocket.reduxMiddleware()),
  );
  const persistor = persistStore(store);

  return { store, persistor };
};

export const selectChapterProgress = (state: CourseState, { course, lesson, chapter }: ChapterProp) => {
  if ((state.progress[course] as LessonsProgress | undefined) === undefined) {
    return false;
  }

  if ((state.progress[course][lesson] as ChaptersProgress | undefined) === undefined) {
    return false;
  }

  return state.progress[course][lesson][chapter];
};

export const selectLessonProgress = (state: CourseState, { course, lesson }: LessonProp) => {
  if ((state.progress[course] as LessonsProgress | undefined) === undefined) {
    return {};
  }

  if ((state.progress[course][lesson] as ChaptersProgress | undefined) === undefined) {
    return {};
  }

  return state.progress[course][lesson];
};

export const selectCourseProgress = (state: CourseState, { course }: CourseProp) => {
  if ((state.progress[course] as LessonsProgress | undefined) === undefined) {
    return {};
  }

  return state.progress[course];
};
