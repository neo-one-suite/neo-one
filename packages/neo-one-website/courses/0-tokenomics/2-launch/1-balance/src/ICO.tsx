// tslint:disable-next-line
import { FromStream } from '@neo-one/react';
import { Box } from '@neo-one/react-core';
import * as React from 'react';
import { defer } from 'rxjs';
import styled from 'styled-components';
import { prop } from 'styled-tools';
// @ts-ignore
import { WithContracts } from '../one/generated';
import { getTokenInfo } from './utils';

const StyledGrid = styled(Box)`
  display: grid;
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  background-color: ${prop('theme.gray0')};
  padding: 8px;
  margin: 8px;
  color: ${prop('theme.black')};
  grid-template-columns: '160px 1fr';
  grid-auto-rows: auto;
  gap: 0;
`;

const Wrapper = styled(Box)`
  display: grid;
  justify-items: center;
`;

const InnerWrapper = styled(Box)`
  max-width: 400px;
`;

export const ICO = (props: {}) => (
  <WithContracts>
    {/*
      // @ts-ignore */}
    {({ token }) => (
      <FromStream props={[token]} createStream={() => defer(async () => getTokenInfo(token))}>
        {(value) => (
          <Wrapper>
            <InnerWrapper>
              <StyledGrid {...props}>
                <Box>Name:</Box>
                <Box>{value.name}</Box>
                <Box>Symbol:</Box>
                <Box>{value.symbol}</Box>
                <Box>Total Supply:</Box>
                <Box>{value.totalSupply.toFormat()}</Box>
                <Box>Amount Per NEO:</Box>
                <Box>{value.amountPerNEO.toFormat()}</Box>
                <Box>NEO Contributed:</Box>
                <Box>{value.totalSupply.div(value.amountPerNEO).toFormat()}</Box>
                <Box>Remaining:</Box>
                <Box>{value.remaining.toFormat()}</Box>
                <Box>Start Time:</Box>
                <Box>{new Date(value.icoStartTimeSeconds.toNumber() * 1000).toLocaleString()}</Box>
                <Box>Duration:</Box>
                <Box>{value.icoDurationSeconds.toNumber() / (60 * 60)} hours</Box>
                <Box>Your Balance:</Box>
                <Box>{value.balance.toFormat()}</Box>
              </StyledGrid>
            </InnerWrapper>
          </Wrapper>
        )}
      </FromStream>
    )}
  </WithContracts>
);
