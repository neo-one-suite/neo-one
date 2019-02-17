import { theme } from '@neo-one/react-common';
import * as React from 'react';
import { ThemeProvider as ThemeProviderBase } from 'styled-components';

interface Props {
  // tslint:disable-next-line:no-any
  readonly children: string | number | React.ReactElement | undefined;
}
export function ThemeProvider({ children }: Props) {
  return <ThemeProviderBase theme={theme}>{children}</ThemeProviderBase>;
}
