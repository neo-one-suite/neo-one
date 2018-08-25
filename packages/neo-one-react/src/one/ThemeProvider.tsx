import * as React from 'react';
import { injectGlobal, ThemeProvider as ThemeProviderBase } from 'reakit';
import bold from '../../static/font/Axiforma-Bold.woff';
import bold2 from '../../static/font/Axiforma-Bold.woff2';
import book from '../../static/font/Axiforma-Book.woff';
import book2 from '../../static/font/Axiforma-Book.woff2';
import medium from '../../static/font/Axiforma-Medium.woff';
import medium2 from '../../static/font/Axiforma-Medium.woff2';
import regular from '../../static/font/Axiforma-Regular.woff';
import regular2 from '../../static/font/Axiforma-Regular.woff2';
import semiBold from '../../static/font/Axiforma-SemiBold.woff';
import semiBold2 from '../../static/font/Axiforma-SemiBold.woff2';
import { theme } from './theme';

interface Props {
  readonly children: React.ReactNode;
}
export function ThemeProvider({ children }: Props) {
  // tslint:disable-next-line no-unused-expression
  injectGlobal`
    @font-face {
      font-family: 'Axiforma-Bold';
      src: url('${bold2}') format('woff2'), url('${bold}') format('woff');
      font-weight: 700;
      font-style: normal;
    }

    @font-face {
      font-family: 'Axiforma-SemiBold';
      src: url('${semiBold2}') format('woff2'), url('${semiBold}') format('woff');
      font-weight: 600;
      font-style: normal;
    }

    @font-face {
      font-family: 'Axiforma-Medium';
      src: url('${medium2}') format('woff2'), url('${medium}') format('woff');
      font-weight: 500;
      font-style: normal;
    }

    @font-face {
      font-family: 'Axiforma-Regular';
      src: url('${regular2}') format('woff2'), url('${regular}') format('woff');
      font-weight: 400;
      font-style: normal;
    }

    @font-face {
      font-family: 'Axiforma-Book';
      src: url('${book2}') format('woff2'), url('${book}') format('woff');
      font-weight: 200;
      font-style: normal;
    }
  `;

  return <ThemeProviderBase theme={theme}>{children}</ThemeProviderBase>;
}
