import * as React from 'react';
// tslint:disable-next-line no-submodule-imports
import Select from 'react-select/lib/Select';
import { Flex, Input, styled } from 'reakit';
import { FromStream } from '../FromStream';
import { ComponentProps } from '../types';
import { Button } from './Button';
import { WithTokens } from './DeveloperToolsContext';
import { Selector } from './Selector';
import { Asset, ASSETS, getTokenAsset, TransferContainer } from './TransferContainer';

const StyledFlex = styled(Flex)`
  align-items: center;
  margin: 16px 0;
`;

const StyledInput = styled(Input)`
  margin-right: 8px;
`;

const AssetInput = styled(Selector)`
  margin-right: 8px;
  width: 144px;
` as React.ComponentType<ComponentProps<Select<Asset>>>;

export const TransferAmount = (props: ComponentProps<typeof Flex>) => (
  <TransferContainer>
    {({ text, asset, amount, to, loading, onChangeAmount, onChangeAsset, send }) => (
      <StyledFlex {...props}>
        <StyledInput value={text} placeholder="Amount" onChange={onChangeAmount} />
        <WithTokens>
          {(tokens$) => (
            <FromStream props$={tokens$}>
              {(tokens) => (
                <AssetInput
                  value={asset}
                  options={ASSETS.concat(tokens.map(getTokenAsset))}
                  onChange={(option) => {
                    if (option != undefined && !Array.isArray(option)) {
                      onChangeAsset(option);
                    }
                  }}
                />
              )}
            </FromStream>
          )}
        </WithTokens>
        <Button disabled={to.length === 0 || amount === undefined || loading} onClick={send}>
          Send
        </Button>
      </StyledFlex>
    )}
  </TransferContainer>
);
