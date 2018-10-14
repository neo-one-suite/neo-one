import { FromStream } from '@neo-one/react';
import BigNumber from 'bignumber.js';
import * as React from 'react';
import { Grid, styled } from 'reakit';
import { combineLatest, concat, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
// @ts-ignore
import { WithContracts } from '../one/generated';

const StyledGrid = styled(Grid)`
  padding: 8px 0;
  color: ${({ theme }) => theme.gray0};
`;

export const Info = (props: {}) => (
  <WithContracts>
    {/*
      // @ts-ignore */}
    {({ client, token }) => (
      <FromStream
        props$={concat(
          of(undefined),
          combineLatest(client.block$, client.currentUserAccount$, client.currentNetwork$).pipe(
            // @ts-ignore
            switchMap(([{ block }, account, network]) =>
              Promise.resolve().then(async () => {
                const [amountPerNEO, totalSupply, remaining, balance] = await Promise.all([
                  token.amountPerNEO(),
                  token.totalSupply(),
                  token.remaining(),
                  account === undefined ? Promise.resolve(new BigNumber(0)) : token.balanceOf(account.id.address),
                ]);

                return {
                  amountPerNEO,
                  totalSupply,
                  remaining,
                  nowMS: block.time * 1000,
                  balance,
                  address: token.definition.networks[network].address,
                };
              }),
            ),
          ),
        )}
      >
        {(value) => (
          <StyledGrid columns="160px 1fr" autoRows="auto" gap="0" {...props}>
            <Grid.Item data-test="info-neo-contributed">NEO Contributed:</Grid.Item>
            <Grid.Item data-test="info-neo-contributed-value">
              {/*
                // @ts-ignore */}
              {value === undefined ? '' : value.totalSupply.div(value.amountPerNEO).toFormat()}
            </Grid.Item>
            <Grid.Item data-test="info-remaining">Remaining:</Grid.Item>
            <Grid.Item data-test="info-remaining-value">
              {/*
                // @ts-ignore */}
              {value === undefined ? '' : value.remaining.toFormat()}
            </Grid.Item>
            <Grid.Item data-test="info-balance">Your Balance:</Grid.Item>
            {/*
              // @ts-ignore */}
            <Grid.Item data-test="info-balance-value">{value === undefined ? '' : value.balance.toFormat()}</Grid.Item>
            <Grid.Item data-test="info-address">ONE Address:</Grid.Item>
            {/*
              // @ts-ignore */}
            <Grid.Item data-test="info-address-value">{value === undefined ? '' : value.address}</Grid.Item>
          </StyledGrid>
        )}
      </FromStream>
    )}
  </WithContracts>
);
