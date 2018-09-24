import * as React from 'react';
import { Grid, styled } from 'reakit';
import { MonacoEditor } from '../../MonacoEditor';
import { Tutorial } from './Tutorial';

const StyledGrid = styled(Grid)`
  width: 100%;
`;

const template = `
  "tutorial editor" auto
  / minmax(560px, 2fr) 3fr
`;

export const InteractiveApp = () => (
  <StyledGrid template={template}>
    <Grid.Item area="tutorial">
      <Tutorial />
    </Grid.Item>
    <Grid.Item area="editor">
      <MonacoEditor
        file={{
          path: 'test.ts',
          content: 'console.log("foo")',
        }}
        language="typescript-smart-contract"
      />
    </Grid.Item>
  </StyledGrid>
);
