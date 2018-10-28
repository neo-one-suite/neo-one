import BigNumber from 'bignumber.js';
// tslint:disable-next-line
import { FromStream } from '@neo-one/react';
// tslint:disable-next-line
import { Button, TextInput } from '@neo-one/react-common';
import * as React from 'react';
import { Box, Grid, styled } from 'reakit';
import { defer } from 'rxjs';
import { prop } from 'styled-tools';
// @ts-ignore
import { TokenSmartContract, WithContracts } from '../one/generated';
import { getTokenInfo, handleMint, TokenInfoResult } from './utils';

const InfoGrid = styled(Grid)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  background-color: ${prop('theme.gray0')};
  padding: 8px;
  margin: 8px;
  color: ${prop('theme.black')};
`;

const ContributeGrid = styled(Grid)`
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

const SendWrapper = styled(Grid)`
  grid-area: send;
  grid-auto-flow: column;
  justify-items: end;
`;

const Wrapper = styled(Grid)`
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
        {({ token }) => (
          <FromStream props={[token]} createStream={() => defer<TokenInfoResult>(async () => getTokenInfo(token))}>
            {(value) => (
              <Wrapper>
                <InnerWrapper>
                  <InfoGrid columns="160px 1fr" autoRows="auto" gap="0">
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
                    <Grid.Item>Your Balance:</Grid.Item>
                    <Grid.Item>{value.balance.toFormat()}</Grid.Item>
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
