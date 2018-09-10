import * as React from 'react';
import { hot } from 'react-hot-loader';
import { ContractsProvider, DeveloperTools, WithContracts } from '../one/generated';

export const App = hot(module)(() => (
  <ContractsProvider>
    <WithContracts>
      {({ contract }) => (
        <button
          onClick={() => {
            contract.myFirstMethod.confirmed();
          }}
        >
          Click Me!
        </button>
      )}
    </WithContracts>
    <DeveloperTools />
  </ContractsProvider>
));
