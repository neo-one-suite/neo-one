import { Button } from '@neo-one/react-common';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { as, Box, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Footer } from '../../Footer';
import { RouterLink } from '../../RouterLink';
import { Markdown } from '../common';
import { selectLesson } from '../coursesData';
import { SelectedLesson } from '../types';

interface Props {
  readonly selected: SelectedLesson;
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

const StartButton = styled(as(RouterLink)(Button))`
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

export const LessonView = ({ selected }: Props) => (
  <Wrapper>
    <Helmet>
      <title>{`Lesson ${selected.lesson + 1}: ${selectLesson(selected).title} - NEO•ONE`}</title>
    </Helmet>
    <BoxWrapper>
      <InnerWrapper>
        <Markdown source={selectLesson(selected).documentation} />
        <ButtonWrapper>
          <Text>
            Lesson {selected.lesson + 1}: {selectLesson(selected).title}
          </Text>
          <StartButton data-test="start" to={`/course/${selected.course}/${selected.lesson + 1}/1`}>
            Start
          </StartButton>
        </ButtonWrapper>
      </InnerWrapper>
    </BoxWrapper>
    <Footer />
  </Wrapper>
);
