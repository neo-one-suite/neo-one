import { Link } from '@neo-one/react-common';
// @ts-ignore
import { Parser } from 'html-to-react';
import * as React from 'react';
import styled from 'styled-components';
import { ifProp, prop } from 'styled-tools';
import { Prism } from '../../common';
import { RouterLink } from '../RouterLink';
import { WordTokens } from './types';

const ReferenceLink = styled(Link.withComponent(RouterLink))<{ readonly code?: boolean }>`
  font-family: ${ifProp('code', "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace")};
  ${ifProp('code', prop('theme.fontStyles.subheading'))};
`;

export const buildExample = (example: WordTokens) =>
  example.map((token, idx) =>
    token.slug === undefined ? (
      <span key={idx}>
        {new Parser().parse(Prism.highlight(`${token.value} `, Prism.languages.typescript, 'typescript'), 'text/xml')}
      </span>
    ) : (
      <ReferenceLink to={token.slug} linkColor="accent" code key={idx}>
        {`${token.value} `}
      </ReferenceLink>
    ),
  );

export const buildText = (example: WordTokens) =>
  example.map((token, idx) =>
    token.slug === undefined ? (
      <span key={idx}>{`${token.value} `}</span>
    ) : (
      <ReferenceLink to={token.slug} linkColor="accent" key={idx}>
        {`${token.value} `}
      </ReferenceLink>
    ),
  );
