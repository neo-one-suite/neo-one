import * as React from 'react';
import { EditorContext } from '../EditorContext';
import { PreviewContent } from './PreviewContent';

export const Preview = () => (
  <EditorContext.Consumer>{({ engine }) => <PreviewContent engine={engine} />}</EditorContext.Consumer>
);
