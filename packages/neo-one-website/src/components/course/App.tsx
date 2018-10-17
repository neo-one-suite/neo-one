import { Redirect, RouteComponentProps, Router } from '@reach/router';
import * as React from 'react';
import { Provider } from 'react-redux';
// tslint:disable-next-line no-submodule-imports
import { PersistGate } from 'redux-persist/integration/react';
import { ChapterView } from './chapter';
import { CoursesView } from './courses';
import { LessonView } from './lesson';
import { Loading } from './Loading';
import { configureStore } from './redux';

const { store, persistor } = configureStore();

const RedirectRoute = (_props: RouteComponentProps) => <Redirect to="course" />;
const CoursesRoute = (_props: RouteComponentProps) => <CoursesView />;

interface LessonParams {
  readonly course: string;
  readonly lesson: string;
}
const LessonRoute = ({ course, lesson }: RouteComponentProps<{ readonly course: string; readonly lesson: string }>) => {
  if (course === undefined || lesson === undefined) {
    return <Redirect to="course" />;
  }

  return (
    <LessonView
      selected={{
        course,
        lesson: parseInt(lesson, 10) - 1,
      }}
    />
  );
};

interface ChapterParams extends LessonParams {
  readonly chapter: string;
}
const ChapterRoute = ({ course, lesson, chapter }: RouteComponentProps<ChapterParams>) => {
  if (course === undefined || lesson === undefined || chapter === undefined) {
    return <Redirect to="course" />;
  }

  return (
    <ChapterView
      selected={{
        course,
        lesson: parseInt(lesson, 10) - 1,
        chapter: parseInt(chapter, 10) - 1,
      }}
    />
  );
};

export const App = () => (
  <Provider store={store}>
    <PersistGate loading={<Loading />} persistor={persistor}>
      <Router>
        <CoursesRoute path="course" />
        <LessonRoute path="course/:course/:lesson" />
        <ChapterRoute path="course/:course/:lesson/:chapter" />
        <RedirectRoute default />
      </Router>
    </PersistGate>
  </Provider>
);
