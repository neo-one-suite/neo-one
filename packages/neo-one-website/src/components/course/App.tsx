import * as React from 'react';
import { Redirect, Route, Switch } from 'react-static';
// tslint:disable-next-line no-submodule-imports
import { ChapterView } from './chapter';
import { CoursesView } from './courses';
import { LessonView } from './lesson';

export const App = () => (
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
);
