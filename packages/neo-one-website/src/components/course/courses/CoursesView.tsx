import styled from '@emotion/styled';
import { Background, Box } from '@neo-one/react-common';
import * as React from 'react';
import { prop } from 'styled-tools';
import { Tagline } from '../../../elements';
import { Footer } from '../../Footer';
import { courses } from '../coursesData';
import { CourseExplainer } from './CourseExplainer';
import { CourseSection } from './CourseSection';

// tslint:disable-next-line: no-any
const StyledBackground = styled<any>(Background)<any>`
  display: flex;
  color: ${prop('theme.gray0')};
  justify-content: center;
  min-height: 240px;
  width: 100%;
`;

const Headline = styled(Box)<{}, {}>`
  color: ${prop('theme.gray0')};
  ${prop('theme.fontStyles.display1')};
  ${prop('theme.fonts.axiformaRegular')};
`;

const HeaderWrapper = styled(Box)`
  display: grid;
  max-width: 1100px;
  margin: 56px;
  gap: 24;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  justify-content: start;
  align-content: start;
  justify-items: start;
  align-items: start;
  width: 100%;
`;

const ContentWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const Wrapper = styled(Box)`
  display: flex;
  flex-direction: column;
`;

export const CoursesView = (props: {}) => (
  <Wrapper {...props}>
    <StyledBackground>
      <HeaderWrapper>
        <Tagline />
        <Headline>Learn to Build NEO DApps with NEO•ONE.</Headline>
      </HeaderWrapper>
    </StyledBackground>
    <ContentWrapper>
      <CourseExplainer />
      {Object.entries(courses).map(([slug, course], idx) => (
        <CourseSection key={slug} index={idx} slug={slug} course={course} />
      ))}
    </ContentWrapper>
    <Footer />
  </Wrapper>
);
