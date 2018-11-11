import { Button } from '@neo-one/react-common';
import * as React from 'react';
import { connect } from 'react-redux';
import { Box, Flex, Grid, Hidden, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Collapse } from '../../../containers';
import { Client, Contract, Debugging, Num } from '../../../elements';
import { getLessonName, getLessonTo, ProgressBar } from '../common';
import { ChaptersProgress, CourseState, LessonsProgress, selectCourseProgress } from '../redux';
import { Course, Lesson } from '../types';
import { maxWidth } from './constants';
import { ContentWrapper } from './ContentWrapper';
import { LessonList } from './LessonList';

const StyledContract = styled(Contract)`
  display: block;
  height: 100%;
`;

const StyledDebugging = styled(Debugging)`
  display: block;
  height: 100%;
`;

const StyledClient = styled(Client)`
  display: block;
  height: 100%;
`;

const images = {
  contract: StyledContract,
  debugging: StyledDebugging,
  client: StyledClient,
};

const Wrapper = styled(Grid)`
  width: 100%;
  max-width: ${maxWidth};
  grid:
    'image text' auto
    / auto minmax(480px, 1fr);
`;

const ImageWrapper = styled(Flex)`
  height: 136px;
  width: 100%;
  align-items: center;
`;

const background: ReadonlyArray<string> = ['light', 'gray5', 'darkLight'];

// tslint:disable-next-line no-any
const StartButton = styled(Button)`
  grid-area: button;
  place-self: center;

  &&& {
    text-decoration: none;
    cursor: pointer;
    outline: none;
  }
`;

const Title = styled(Box)`
  ${prop('theme.fontStyles.headline')};
  ${prop('theme.fonts.axiformaRegular')};
`;

const Text = styled(Box)`
  ${prop('theme.fontStyles.subheading')};
  ${prop('theme.fonts.axiformaMedium')};
`;

const StyledLessonList = styled(LessonList)`
  width: 100%;
`;

const StyledNumber = styled(Num)`
  display: block;
  height: 80%;
`;

const TextWrapper = styled(Box)`
  display: grid;
  grid:
    'title' auto
    'text' auto
    / auto;
  grid-gap: 8px;
`;

const template = `
  "text button" 120px
  "progress empty" auto
  "list empty" auto
  / 1fr 160px
`;

const isLessonComplete = (lesson: Lesson, lessonIndex: number, progress: LessonsProgress) => {
  if ((progress[lessonIndex] as ChaptersProgress | undefined) === undefined) {
    return false;
  }

  return lesson.chapters.every((_chapter, chapter) => progress[lessonIndex][chapter]);
};

interface ExternalProps {
  readonly slug: string;
  readonly course: Course;
  readonly index: number;
}

interface Props extends ExternalProps {
  readonly progress: LessonsProgress;
}

const CourseSectionBase = ({ slug, course, index, progress }: Props) => {
  const Image = images[course.image];
  const bg = background[index % background.length];

  return (
    <ContentWrapper bg={bg}>
      <Wrapper gap={16}>
        <ImageWrapper>
          <StyledNumber num={index} />
          <Image />
        </ImageWrapper>
        <Grid template={template} gap={8}>
          <Grid.Item area="text">
            <TextWrapper>
              <Title>{course.title}</Title>
              <Text>{course.description}</Text>
            </TextWrapper>
          </Grid.Item>
          <Grid.Item area="progress">
            <ProgressBar
              items={course.lessons.map((lesson, idx) => ({
                complete: isLessonComplete(lesson, idx, progress),
                title: getLessonName(lesson.title, idx),
                to: getLessonTo(slug, idx),
              }))}
            />
          </Grid.Item>
          <Hidden.Container initialState={{ visible: index === 0 }}>
            {({ visible, toggle }) => (
              <>
                <StartButton onClick={toggle}>{visible ? 'Hide' : 'Show'} Lessons</StartButton>
                <Grid.Item area="list">
                  <Collapse visible={visible}>
                    <StyledLessonList slug={slug} lessons={course.lessons} />
                  </Collapse>
                </Grid.Item>
              </>
            )}
          </Hidden.Container>
        </Grid>
      </Wrapper>
    </ContentWrapper>
  );
};

export const CourseSection = connect((state: CourseState, { slug }: ExternalProps) => ({
  progress: selectCourseProgress(state, { course: slug }),
}))(CourseSectionBase);
