import * as React from 'react';
import { Base, Label, styled } from 'reakit';
import { FromStream } from '../FromStream';
import { ComponentProps } from '../types';
import { DeveloperToolsContext, WithTokens } from './DeveloperToolsContext';
import { TransferContainer } from './TransferContainer';
import { getOptions$, makeValueOption, WalletSelectorBase } from './WalletSelectorBase';
import { WithAddError } from './WithAddError';

const Wrapper = styled(Base)`
  border-top: 1px solid rgba(0, 0, 0, 0.3);
  margin: 16px 0;
  padding-top: 16px;
`;

const StyledLabel = styled(Label)`
  align-items: center;
  display: flex;
  font: inherit;
  justify-content: space-between;
  line-height: inherit;
`;

export function TransferTo(props: ComponentProps<typeof StyledLabel>) {
  return (
    <WithAddError>
      {(addError) => (
        <WithTokens>
          {(tokens$) => (
            <DeveloperToolsContext.Consumer>
              {({ client }) => {
                const props$ = getOptions$(addError, client, tokens$);

                return (
                  <Wrapper>
                    <StyledLabel {...props}>
                      <Base data-test="neo-one-transfer-to-text" marginRight={8}>
                        Transfer To
                      </Base>
                      <TransferContainer>
                        {({ to, onChangeTo }) => (
                          <FromStream props$={props$}>
                            {(options) => (
                              <WalletSelectorBase
                                data-test="neo-one-transfer-to-selector"
                                value={to.map((userAccount) => makeValueOption({ userAccount }))}
                                options={options}
                                onChange={(option) => {
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
                    </StyledLabel>
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
