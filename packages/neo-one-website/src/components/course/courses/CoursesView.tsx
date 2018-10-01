import * as React from 'react';
import { Box, Flex, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Background, Tagline } from '../../../elements';
import { Footer } from '../../Footer';
import { courses } from '../coursesData';
import { CourseSection } from './CourseSection';

const FlexBackground = Flex.as(Background);
const StyledBackground = styled(FlexBackground)`
  color: ${prop('theme.gray0')};
  justify-content: center;
  min-height: 240px;
  width: 100%;
`;

const Headline = styled(Box)`
  color: ${prop('theme.gray0')};
  ${prop('theme.fontStyles.display1')};
  ${prop('theme.fonts.axiformaRegular')};
`;

const HeaderWrapper = styled(Grid)`
  max-width: 1100px;
  margin: 56px;
`;

const ContentWrapper = styled(Flex)`
  flex-direction: column;
`;

const Wrapper = styled(Flex)`
  flex-direction: column;
`;

export const CoursesView = (props: {}) => (
  <Wrapper {...props}>
    <StyledBackground>
      <HeaderWrapper
        gap={24}
        columns="repeat(auto-fill, minmax(480px, 1fr))"
        justifyContent="start"
        alignContent="start"
        justifyItems="start"
        alignItems="start"
        width="100%"
      >
        <Tagline />
        <Headline>Learn to Build NEO DApps with NEO•ONE.</Headline>
      </HeaderWrapper>
    </StyledBackground>
    <ContentWrapper>
      {Object.entries(courses).map(([slug, course], idx) => (
        <CourseSection key={slug} index={idx} slug={slug} course={course} />
      ))}
    </ContentWrapper>
    <Footer />
  </Wrapper>
);
