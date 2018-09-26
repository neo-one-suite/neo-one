import { Button } from '@neo-one/react';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-static';
import { as, Box, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Footer } from '../../Footer';
import { Markdown } from '../common';
import { selectLesson } from '../redux';
import { Lesson, SelectedLesson } from '../types';

interface ExternalProps {
  readonly selected: SelectedLesson;
}

interface Props extends ExternalProps {
  readonly lesson: Lesson;
}

const Wrapper = styled(Box)`
  height: 100%;
  width: 100%;
`;

const BoxWrapper = styled(Grid)`
  background-color: ${prop('theme.gray6')};
  padding-top: 64px;
  padding-bottom: 128px;
  width: 100%;
  place-items: center;
  place-content: center;
`;

const InnerWrapper = styled(Grid)`
  background-color: ${prop('theme.black')};
  max-width: 720px;
  margin: 16px;
  box-shadow: 0 6px 4px 4px rgba(0, 0, 0, 0.2);
`;

const StartButton = styled(as(Link)(Button))`
  text-decoration: none;
  cursor: pointer;
  border-radius: 16px;
`;

const ButtonWrapper = styled(Grid)`
  color: ${prop('theme.gray0')};
  background-color: ${prop('theme.gray4')};
  grid-auto-flow: column;
  align-items: center;
  justify-content: end;
  justify-items: end;
  grid-gap: 16px;
  padding: 8px;
`;

const Text = styled(Box)`
  ${prop('theme.fontStyles.headline')};
`;

const LessonViewBase = ({ selected, lesson }: Props) => (
  <Wrapper>
    <BoxWrapper>
      <InnerWrapper>
        <Markdown source={lesson.documentation} />
        <ButtonWrapper>
          <Text>
            Lesson {selected.lesson + 1}: {lesson.title}
          </Text>
          <StartButton to={`/course/${selected.course}/${selected.lesson + 1}/1`}>Start</StartButton>
        </ButtonWrapper>
      </InnerWrapper>
    </BoxWrapper>
    <Footer />
  </Wrapper>
);

export const LessonView = connect(selectLesson)(LessonViewBase);
