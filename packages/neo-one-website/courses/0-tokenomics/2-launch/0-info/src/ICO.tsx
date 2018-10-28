// tslint:disable-next-line
import { FromStream } from '@neo-one/react';
import * as React from 'react';
import { Box, Grid, styled } from 'reakit';
import { defer } from 'rxjs';
import { prop } from 'styled-tools';
// @ts-ignore
import { WithContracts } from '../one/generated';
import { getTokenInfo, TokenInfoResult } from './utils';

const StyledGrid = styled(Grid)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  background-color: ${prop('theme.gray0')};
  padding: 8px;
  margin: 8px;
  color: ${prop('theme.black')};
`;

const Wrapper = styled(Grid)`
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
      <FromStream props={[token]} createStream={() => defer<TokenInfoResult>(async () => getTokenInfo(token))}>
        {(value) => (
          <Wrapper>
            <InnerWrapper>
              <StyledGrid columns="160px 1fr" autoRows="auto" gap="0" {...props}>
                <Grid.Item>Name:</Grid.Item>
                <Grid.Item>{value.name}</Grid.Item>
                <Grid.Item>Symbol:</Grid.Item>
                <Grid.Item>{value.symbol}</Grid.Item>
                <Grid.Item>Total Supply:</Grid.Item>
                <Grid.Item>{value.totalSupply.toFormat()}</Grid.Item>
                <Grid.Item>Amount Per NEO:</Grid.Item>
                <Grid.Item>{value.amountPerNEO.toFormat()}</Grid.Item>
                <Grid.Item>NEO Contributed:</Grid.Item>
                <Grid.Item>{value.totalSupply.div(value.amountPerNEO).toFormat()}</Grid.Item>
                <Grid.Item>Remaining:</Grid.Item>
                <Grid.Item>{value.remaining.toFormat()}</Grid.Item>
                <Grid.Item>Start Time:</Grid.Item>
                <Grid.Item>{new Date(value.icoStartTimeSeconds.toNumber() * 1000).toLocaleString()}</Grid.Item>
                <Grid.Item>Duration:</Grid.Item>
                <Grid.Item>{value.icoDurationSeconds.toNumber() / (60 * 60)} hours</Grid.Item>
              </StyledGrid>
            </InnerWrapper>
          </Wrapper>
        )}
      </FromStream>
    )}
  </WithContracts>
);
