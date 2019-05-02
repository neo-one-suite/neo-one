// tslint:disable no-any
import { UserAccount } from '@neo-one/client-common';
import { Label, useStream } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { DeveloperToolsContext, useTokens } from './DeveloperToolsContext';
import { useAddError } from './ToastsContext';
import { getWalletSelectorOptions$, makeWalletSelectorValueOption, WalletSelectorBase } from './WalletSelectorBase';

const { useContext } = React;

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

interface Props {
  readonly to: readonly UserAccount[];
  readonly onChangeTo: (value: readonly UserAccount[]) => void;
}

export function TransferTo({ to, onChangeTo, ...props }: Props & React.ComponentProps<typeof Wrapper>) {
  const addError = useAddError();
  const [tokens] = useTokens();
  const { client, userAccounts$, block$ } = useContext(DeveloperToolsContext);
  const options = useStream(() => getWalletSelectorOptions$(addError, client, userAccounts$, block$, tokens), [
    addError,
    client,
    userAccounts$,
    block$,
    tokens,
  ]);

  return (
    <Wrapper {...props}>
      Transfer To
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
    </Wrapper>
  );
}
