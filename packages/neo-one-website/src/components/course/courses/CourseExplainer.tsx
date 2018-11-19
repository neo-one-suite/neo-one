import { Box, H2, Link } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { maxWidth } from './constants';
import { ContentWrapper } from './ContentWrapper';

const NavLink = styled(Link)`
  ${prop('theme.fontStyles.subheading')};
`;

const Text = styled(Box)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.subheading')};
  color: ${prop('theme.black')};
`;

const Header = styled(H2)`
  ${prop('theme.fonts.axiformaRegular')}
  ${prop('theme.fontStyles.headline')}
  color: ${prop('theme.black')};
  margin: 0;
`;

const Wrapper = styled(Box)`
  display: grid;
  grid-gap: 16px;
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
        The first course is designed for beginners to NEO•ONE and starts off with the basics. Each course builds on the
        knowledge gained in the previous ones.
      </Text>
      <Text>
        The courses assume some knowledge of blockchain and NEO concepts, though you don't need to be an expert. Reading
        through the{' '}
        <NavLink linkColor="primary" href="/docs/blockchain-basics" target="_blank">
          Blockchain Basics
        </NavLink>{' '}
        chapter of the main guide will sufficiently prepare you for the course.
      </Text>
    </Wrapper>
  </ContentWrapper>
);
