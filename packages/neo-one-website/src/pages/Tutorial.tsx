import * as React from 'react';
import { Box, styled } from 'reakit';
import { MonacoEditor } from '../components';

const Wrapper = styled(Box)`
  width: 800px;
  height: 800px;
`;

export const Tutorial = () => (
  <Wrapper>
    <MonacoEditor
      file={{
        path: 'Contract.ts',
        content: `

        import { SmartContract } from '@neo-one/smart-contract';

        export class Foo extends SmartContract {

        }`,
      }}
      language="typescript-smart-contract"
    />
  </Wrapper>
);
