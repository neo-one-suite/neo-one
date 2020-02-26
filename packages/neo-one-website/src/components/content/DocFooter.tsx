// tslint:disable no-null-keyword
import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import * as React from 'react';
import { prop } from 'styled-tools';
import { AdjacentInfo } from '../../types';
import { LayoutWrapper } from '../common';
import { AdjacentLink } from './AdjacentLink';

const Wrapper = styled(Box)<{}, {}>`
  display: grid;
  justify-items: center;
  padding-top: 64px;
  padding-bottom: 64px;
  background-color: ${prop('theme.gray6')};
  width: 100%;
`;

const LinkWrapper = styled(Box)<{}, {}>`
  display: grid;
  grid-auto-flow: column;
  justify-content: space-between;
  grid-gap: 32px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-gap: 16px;
  }
`;

interface Props {
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

export const DocFooter = ({ next, previous, ...props }: Props) =>
  previous === undefined && next === undefined ? null : (
    <Wrapper {...props}>
      <LayoutWrapper>
        <LinkWrapper>
          {previous === undefined ? <Box /> : <AdjacentLink adjacent={previous} />}
          {next === undefined ? <Box /> : <AdjacentLink next adjacent={next} />}
        </LinkWrapper>
      </LayoutWrapper>
    </Wrapper>
  );
