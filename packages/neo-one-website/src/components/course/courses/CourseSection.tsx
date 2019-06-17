import { Box, Button, useHidden } from '@neo-one/react-common';
import * as React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
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

const Wrapper = styled(Box)`
  display: grid;
  gap: 16;
  width: 100%;
  max-width: ${maxWidth};
  grid:
    'image text' auto
    / auto minmax(480px, 1fr);
`;

const ImageWrapper = styled(Box)`
  display: flex;
  height: 136px;
  width: 100%;
  align-items: center;
`;

const background: readonly string[] = ['light', 'gray5', 'darkLight'];

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

const InnerWrapper = styled(Box)<{ readonly template: string }>`
  display: grid;
  grid: ${prop('template')};
  gap: 8;
`;

const TextItem = styled(Box)`
  grid-area: text;
`;

const ProgressItem = styled(Box)`
  grid-area: progress;
`;

const ListItem = styled(Box)`
  grid-area: list;
`;

const template = `
  "text button" auto
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

  const { visible, toggle } = useHidden(index === 0);

  return (
    <ContentWrapper bg={bg}>
      <Wrapper>
        <ImageWrapper>
          <StyledNumber num={index} />
          <Image />
        </ImageWrapper>
        <InnerWrapper template={template}>
          <TextItem>
            <TextWrapper>
              <Title>{course.title}</Title>
              <Text>{course.description}</Text>
            </TextWrapper>
          </TextItem>
          <ProgressItem>
            <ProgressBar
              items={course.lessons.map((lesson, idx) => ({
                complete: isLessonComplete(lesson, idx, progress),
                title: getLessonName(lesson.title, idx),
                to: getLessonTo(slug, idx),
              }))}
            />
          </ProgressItem>
          <StartButton onClick={toggle}>{visible ? 'Hide' : 'Show'} Lessons</StartButton>
          <ListItem>
            <Collapse visible={visible}>
              <StyledLessonList slug={slug} lessons={course.lessons} />
            </Collapse>
          </ListItem>
        </InnerWrapper>
      </Wrapper>
    </ContentWrapper>
  );
};

export const CourseSection = connect((state: CourseState, { slug }: ExternalProps) => ({
  progress: selectCourseProgress(state, { course: slug }),
}))(CourseSectionBase);
