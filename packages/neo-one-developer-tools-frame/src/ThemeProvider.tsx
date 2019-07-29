import { theme } from '@neo-one/react-common';
import { ThemeProvider as ThemeProviderBase } from 'emotion-theming';
import * as React from 'react';

interface Props {
  readonly children: string | number | React.ReactElement | undefined;
}
export function ThemeProvider({ children }: Props) {
  return <ThemeProviderBase theme={theme}>{children}</ThemeProviderBase>;
}
