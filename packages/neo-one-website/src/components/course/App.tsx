import styled from '@emotion/styled';
import { Box, Loading } from '@neo-one/react-common';
import { Redirect, RouteComponentProps, Router } from '@reach/router';
import * as React from 'react';
import { Provider } from 'react-redux';
// tslint:disable-next-line no-submodule-imports
import { PersistGate } from 'redux-persist/integration/react';
import { prop } from 'styled-tools';
import { ChapterView } from './chapter';
import { CoursesView } from './courses';
import { LessonView } from './lesson';
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

const DesktopWrapper = styled(Box)<{}, {}>`
  @media (max-width: ${prop('theme.breakpoints.sm')}) {
    display: none;
  }
`;

const MobileWrapper = styled(Box)<{}, {}>`
  display: none;

  @media (max-width: ${prop('theme.breakpoints.sm')}) {
    display: grid;
    grid-gap: 32px;
    padding: 16px;
  }
`;

const Header = styled.h1<{}, {}>`
  ${prop('theme.fonts.axiformaBold')}
  ${prop('theme.fontStyles.headline')}
  color: ${prop('theme.gray0')};
  margin: 0;
`;

const Text = styled(Box)<{}, {}>`
  ${prop('theme.fonts.axiformaRegular')}
  ${prop('theme.fontStyles.subheading')}
  color: ${prop('theme.gray0')};
  margin: 0;
`;

export const App = () => (
  <>
    <DesktopWrapper>
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
    </DesktopWrapper>
    <MobileWrapper>
      <Header>Uh oh!</Header>
      <Text>
        Looks like you're trying to start the NEO•ONE Courses from a mobile device. NEO•ONE Courses are an interactive
        learning experience designed for desktops and laptops. Come back with your laptop or desktop to experience
        NEO•ONE development.
      </Text>
    </MobileWrapper>
  </>
);
