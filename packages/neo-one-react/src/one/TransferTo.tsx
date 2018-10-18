// tslint:disable no-any
import {
  FromStream,
  getWalletSelectorOptions$,
  makeWalletSelectorValueOption,
  WalletSelectorBase,
  WithAddError,
} from '@neo-one/react-common';
import * as React from 'react';
import { Label, styled } from 'reakit';
import { ComponentProps } from '../types';
import { DeveloperToolsContext, DeveloperToolsContextType, WithTokens } from './DeveloperToolsContext';
import { TransferContainer } from './TransferContainer';

const Wrapper = styled(Label)`
  border-top: 1px solid rgba(0, 0, 0, 0.3);
  margin-top: 8px;
  padding-top: 16px;
  display: grid;
  grid:
    'label input' auto
    / auto 1fr;
  grid-gap: 8px;
  align-items: center;
`;

export function TransferTo(props: ComponentProps<typeof Wrapper>) {
  return (
    <WithAddError>
      {(addError) => (
        <WithTokens>
          {(tokens$) => (
            <DeveloperToolsContext.Consumer>
              {({ client }: DeveloperToolsContextType) => {
                const props$ = getWalletSelectorOptions$(addError, client, tokens$);

                return (
                  <Wrapper {...props}>
                    Transfer To
                    <TransferContainer>
                      {({ to, onChangeTo }) => (
                        <FromStream createStream={() => props$}>
                          {(options) => (
                            <WalletSelectorBase
                              data-test="neo-one-transfer-to-selector"
                              value={to.map((userAccount) => makeWalletSelectorValueOption({ userAccount }))}
                              options={options}
                              onChange={(option: any) => {
                                if (option != undefined) {
                                  if (Array.isArray(option)) {
                                    onChangeTo(option.map(({ userAccount }) => userAccount));
                                  } else {
                                    onChangeTo([option.userAccount]);
                                  }
                                }
                              }}
                              isMulti
                            />
                          )}
                        </FromStream>
                      )}
                    </TransferContainer>
                  </Wrapper>
                );
              }}
            </DeveloperToolsContext.Consumer>
          )}
        </WithTokens>
      )}
    </WithAddError>
  );
}
