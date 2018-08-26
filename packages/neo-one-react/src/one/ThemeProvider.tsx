import * as React from 'react';
import { ThemeProvider as ThemeProviderBase } from 'reakit';
import { theme } from './theme';

interface Props {
  readonly children: React.ReactNode;
}
export function ThemeProvider({ children }: Props) {
  return <ThemeProviderBase theme={theme}>{children}</ThemeProviderBase>;
}
