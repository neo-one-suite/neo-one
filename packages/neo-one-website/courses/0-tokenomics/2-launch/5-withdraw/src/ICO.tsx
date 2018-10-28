import BigNumber from 'bignumber.js';
// tslint:disable-next-line
import { Client } from '@neo-one/client';
// tslint:disable-next-line
import { FromStream } from '@neo-one/react';
// tslint:disable-next-line
import { Button, TextInput } from '@neo-one/react-common';
import * as React from 'react';
import { Box, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
// @ts-ignore
import { TokenSmartContract, WithContracts } from '../one/generated';
import { createTokenInfoStream$, handleMint, handleTransfer, handleWithdraw } from './utils';

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

const TransferGrid = styled(Grid)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  background-color: ${prop('theme.gray0')};
  grid:
    'address address' auto
    'input send' auto
    / 1fr auto;
  grid-gap: 8px;
  padding: 8px;
  margin: 8px;
`;

const WithdrawGrid = styled(Grid)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.body1')};
  background-color: ${prop('theme.gray0')};
  justify-items: end;
  padding: 8px;
  margin: 8px;
`;

const AmountInput = styled(TextInput)`
  grid-area: input;
`;

const AmountText = styled(Box)`
  grid-area: amount;
`;

const AddressInput = styled(TextInput)`
  grid-area: address;
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
  readonly transferText: string;
  readonly transferAddress: string;
  readonly amount?: BigNumber;
  readonly transferAmount?: BigNumber;
  readonly loading: boolean;
}

export class ICO extends React.Component<Props, State> {
  // tslint:disable-next-line
  public state: State = {
    text: '',
    transferText: '',
    transferAddress: '',
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
                  <TransferGrid>
                    <AddressInput
                      value={this.state.transferAddress}
                      placeholder="Transfer To Address"
                      onChange={this.onChangeTransferAddress}
                    />
                    <AmountInput
                      value={this.state.transferText}
                      placeholder="Send EON"
                      onChange={this.onChangeTransferAmount}
                    />
                    <SendWrapper>
                      <Button
                        disabled={this.state.transferAmount === undefined || this.state.loading}
                        onClick={() => this.transfer(client, token)}
                      >
                        Send
                      </Button>
                    </SendWrapper>
                  </TransferGrid>
                  <WithdrawGrid>
                    <Button disabled={this.state.loading} onClick={() => this.withdraw(client, token)}>
                      Withdraw
                    </Button>
                  </WithdrawGrid>
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
    this.setState({ text, amount: this.getAmount(event) });
  };

  // tslint:disable-next-line
  private readonly onChangeTransferAmount = (event: React.SyntheticEvent<any>) => {
    const transferText = event.currentTarget.value;
    this.setState({ transferText, transferAmount: this.getAmount(event) });
  };

  // tslint:disable-next-line
  private readonly onChangeTransferAddress = (event: React.SyntheticEvent<any>) => {
    this.setState({ transferAddress: event.currentTarget.value });
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

  private readonly transfer = (client: Client, token: TokenSmartContract) => {
    const amount = this.state.transferAmount;
    const account = client.getCurrentUserAccount();
    const to = this.state.transferAddress;
    if (amount !== undefined && account !== undefined) {
      this.setState({ loading: true }, () => {
        handleTransfer(token, account.id.address, to, amount)
          .then(() => {
            this.setState({ loading: false });
          })
          .catch((error) => {
            // tslint:disable-next-line
            console.error(error);
            this.setState({ loading: false });
          });
      });
    }
  };

  private readonly withdraw = (client: Client, token: TokenSmartContract) => {
    this.setState({ loading: true }, () => {
      handleWithdraw(client, token)
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
  };

  // tslint:disable-next-line no-any
  private getAmount(event: React.SyntheticEvent<any>) {
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

    return amount;
  }
}
