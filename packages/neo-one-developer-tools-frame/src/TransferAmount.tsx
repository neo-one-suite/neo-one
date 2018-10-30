// tslint:disable no-any
import { Button, FromStream, Select, TextInput } from '@neo-one/react-common';
import * as React from 'react';
import { Grid, styled } from 'reakit';
import { WithTokens } from './DeveloperToolsContext';
import { ASSETS, getTokenAsset, TransferContainer } from './TransferContainer';
import { ComponentProps } from './types';

const Wrapper = styled(Grid)`
  grid-auto-flow: column;
  grid-gap: 8px;
  align-items: center;
`;

const AssetInput = styled(Select)`
  width: 144px;
`;

export const TransferAmount = (props: ComponentProps<typeof Grid>) => (
  <TransferContainer>
    {({ text, asset, amount, to, loading, onChangeAmount, onChangeAsset, send }) => (
      <Wrapper {...props}>
        <TextInput
          data-test="neo-one-transfer-amount-input"
          value={text}
          placeholder="Amount"
          onChange={onChangeAmount}
        />
        <WithTokens>
          {(tokens$) => (
            <FromStream props={[tokens$]} createStream={() => tokens$}>
              {(tokens) => (
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
              )}
            </FromStream>
          )}
        </WithTokens>
        <Button
          data-test="neo-one-transfer-amount-send-button"
          disabled={to.length === 0 || amount === undefined || loading}
          onClick={send}
        >
          Send
        </Button>
      </Wrapper>
    )}
  </TransferContainer>
);
