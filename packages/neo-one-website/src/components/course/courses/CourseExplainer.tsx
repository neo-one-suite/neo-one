import { Link } from '@neo-one/react-common';
import * as React from 'react';
import { as, Box, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { RouterLink } from '../../RouterLink';
import { maxWidth } from './constants';
import { ContentWrapper } from './ContentWrapper';

const NavLink = as(RouterLink)(Link);

const Text = styled(Box)`
  ${prop('theme.fonts.axiformaRegular')}
  ${prop('theme.fontStyles.subheading')}
  color: ${prop('theme.black')};
`;

const Header = styled.h2`
  ${prop('theme.fonts.axiformaRegular')}
  ${prop('theme.fontStyles.headline')}
  color: ${prop('theme.black')};
  margin: 0;
  grid-area: h0;
`;

const Wrapper = styled(Grid)`
  grid-template:
    'h0 h0' auto
    't0 t1' auto
    't2 t3' auto
    / 1fr 1fr;
  grid-gap: 32px;
  padding: 32px;
  max-width: ${maxWidth};
`;

export const CourseExplainer = () => (
  <ContentWrapper bg="darkLight">
    <Wrapper>
      <Header>What are NEO•ONE Courses?</Header>
      <Text>
        NEO•ONE Courses are a free, interactive code school that teach you to build decentralized applications on NEO.
      </Text>
      <Text>
        Build, test and write the UI for smart contracts with the NEO•ONE editor. NEO•ONE Courses distill the essentials
        of dapp development into bite-sized interactive learning chapters.
      </Text>
      <Text>
        The first course is designed for beginners to NEO•ONE and starts off with the absolute basics. Each course
        builds on the knowledge gained in the previous ones.
      </Text>
      <Text>
        The courses assume some knowledge of blockchain and NEO concepts, though you don't need to be an expert. Reading
        through the{' '}
        <NavLink linkColor="primary" to="/docs/blockchain-basics">
          Blockchain Basics
        </NavLink>{' '}
        chapter of the main guide will sufficiently prepare you for the course.
      </Text>
    </Wrapper>
  </ContentWrapper>
);
