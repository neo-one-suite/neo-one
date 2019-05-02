// tslint:disable no-any
import { UserAccount } from '@neo-one/client-common';
import { Box, Button, Select, TextInput } from '@neo-one/react-common';
import BigNumber from 'bignumber.js';
import * as React from 'react';
import styled from 'styled-components';
import { useTokens } from './DeveloperToolsContext';
import { Asset, ASSETS, getTokenAsset } from './transferCommon';

const Wrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  grid-gap: 8px;
  align-items: center;
`;

const AssetInput = styled(Select)`
  width: 144px;
`;

export interface Props {
  readonly text: string;
  readonly asset: Asset;
  readonly amount: BigNumber | undefined;
  readonly loading: boolean;
  readonly to: readonly UserAccount[];
  readonly onChangeAmount: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onChangeAsset: (asset: Asset) => void;
  readonly send: () => void;
}

export const TransferAmount = ({
  text,
  asset,
  amount,
  loading,
  onChangeAmount,
  onChangeAsset,
  send,
  to,
  ...props
}: Props & React.ComponentProps<typeof Wrapper>) => {
  const [tokens] = useTokens();

  return (
    <Wrapper {...props}>
      <TextInput
        data-test="neo-one-transfer-amount-input"
        value={text}
        placeholder="Amount"
        onChange={onChangeAmount}
      />
      <AssetInput
        data-test="neo-one-transfer-amount-asset-selector"
        value={asset}
        options={ASSETS.concat(tokens.map(getTokenAsset))}
        onChange={(option: any) => {
          if (option != undefined && !Array.isArray(option)) {
            onChangeAsset(option);
          }
        }}
      />
      <Button
        data-test="neo-one-transfer-amount-send-button"
        disabled={to.length === 0 || amount === undefined || loading}
        onClick={send}
      >
        Send
      </Button>
    </Wrapper>
  );
};
