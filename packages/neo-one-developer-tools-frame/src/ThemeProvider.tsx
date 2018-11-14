import { theme } from '@neo-one/react-common';
import * as React from 'react';
import { ThemeProvider as ThemeProviderBase } from 'reakit';

interface Props {
  readonly children: React.ReactNode;
}
export function ThemeProvider({ children }: Props) {
  return <ThemeProviderBase theme={theme}>{children}</ThemeProviderBase>;
}
