import BigNumber from 'bignumber.js';
// tslint:disable-next-line
import { FromStream } from '@neo-one/react';
// tslint:disable-next-line
import { Box, Button, TextInput } from '@neo-one/react-core';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
// @ts-ignore
import { TokenSmartContract, WithContracts } from '../one/generated';
import { createTokenInfoStream$, handleMint } from './utils';

const InfoGrid = styled(Box)`
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

const ContributeGrid = styled(Box)`
  display: grid;
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  background-color: ${prop('theme.gray0')};
  grid:
    'input amount' auto
    'empty send' auto
    / 1fr auto;
  grid-gap: 8px;
  padding: 8px;
  margin: 8px;
`;

const AmountInput = styled(TextInput)`
  grid-area: input;
`;

const AmountText = styled(Box)`
  grid-area: amount;
`;

const SendWrapper = styled(Box)`
  display: grid;
  grid-area: send;
  grid-auto-flow: column;
  justify-items: end;
`;

const Wrapper = styled(Box)`
  display: grid;
  justify-items: center;
`;

const InnerWrapper = styled(Box)`
  max-width: 400px;
`;

interface Props {}
interface State {
  readonly text: string;
  readonly amount?: BigNumber;
  readonly loading: boolean;
}

export class ICO extends React.Component<Props, State> {
  // tslint:disable-next-line
  public state: State = {
    text: '',
    loading: false,
  };

  public render() {
    return (
      <WithContracts>
        {/*
          // @ts-ignore */}
        {({ client, token }) => (
          <FromStream props={[client, token]} createStream={() => createTokenInfoStream$(client, token)}>
            {(value) => (
              <Wrapper>
                <InnerWrapper>
                  <InfoGrid>
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
                  </InfoGrid>
                  <ContributeGrid>
                    <AmountInput value={this.state.text} placeholder="Send NEO" onChange={this.onChangeAmount} />
                    <AmountText>
                      {this.state.amount === undefined ? '0' : value.amountPerNEO.times(this.state.amount).toFormat()}
                    </AmountText>
                    <SendWrapper>
                      <Button
                        disabled={this.state.amount === undefined || this.state.loading}
                        onClick={() => this.send(token)}
                      >
                        Send
                      </Button>
                    </SendWrapper>
                  </ContributeGrid>
                </InnerWrapper>
              </Wrapper>
            )}
          </FromStream>
        )}
      </WithContracts>
    );
  }

  // tslint:disable-next-line
  private readonly onChangeAmount = (event: React.SyntheticEvent<any>) => {
    const text = event.currentTarget.value;
    let amount: BigNumber | undefined;
    try {
      amount = new BigNumber(text);
      if (amount.toString() !== text) {
        amount = undefined;
      }
    } catch {
      // do nothing
    }

    this.setState({ text, amount });
  };

  private readonly send = (token: TokenSmartContract) => {
    const amount = this.state.amount;
    if (amount !== undefined) {
      this.setState({ loading: true }, () => {
        handleMint(token, amount)
          .then(() => {
            this.setState({ loading: false });
          })
          .catch((error) => {
            // We should show an error message, but for the course we'll just log the error to console.
            // tslint:disable-next-line
            console.error(error);
            this.setState({ loading: false });
          });
      });
    }
  };
}
