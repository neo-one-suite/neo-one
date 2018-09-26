import * as React from 'react';
import { Provider } from 'react-redux';
import { Redirect, Route, Switch } from 'react-static';
// tslint:disable-next-line no-submodule-imports
import { PersistGate } from 'redux-persist/integration/react';
import { ChapterView } from './chapter';
import { CoursesView } from './courses';
import { LessonView } from './lesson';
import { Loading } from './Loading';
import { persistor, store } from './redux';

export const App = () => (
  <Provider store={store}>
    <PersistGate loading={<Loading />} persistor={persistor}>
      <Switch>
        <Route exact path="/course" component={CoursesView} />
        <Route
          exact
          path="/course/:course/:lesson"
          render={({ match }) => (
            <LessonView
              selected={{
                course: match.params.course,
                lesson: parseInt(match.params.lesson, 10) - 1,
              }}
            />
          )}
        />
        <Route
          exact
          path="/course/:course/:lesson/:chapter"
          render={({ match }) => (
            <ChapterView
              selected={{
                course: match.params.course,
                lesson: parseInt(match.params.lesson, 10) - 1,
                chapter: parseInt(match.params.chapter, 10) - 1,
              }}
            />
          )}
        />
        <Route>
          <Redirect to="/course" />
        </Route>
      </Switch>
    </PersistGate>
  </Provider>
);
