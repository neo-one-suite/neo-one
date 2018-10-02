import * as React from 'react';
import { EditorContext as EditorContextType } from './types';

// tslint:disable-next-line no-any
export const EditorContext = React.createContext<EditorContextType>(undefined as any);
