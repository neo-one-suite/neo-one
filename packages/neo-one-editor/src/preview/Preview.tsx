import * as React from 'react';
import { EditorContext } from '../EditorContext';
import { EditorContextType } from '../types';
import { PreviewContent } from './PreviewContent';

export const Preview = () => (
  <EditorContext.Consumer>
    {({ engine }: EditorContextType) => <PreviewContent engine={engine} />}
  </EditorContext.Consumer>
);
