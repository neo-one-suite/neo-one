import { Link } from '@neo-one/react-common';
// @ts-ignore
import { Parser } from 'html-to-react';
import * as React from 'react';
import styled from 'styled-components';
import { ifProp, prop } from 'styled-tools';
import { Prism } from '../../../common';
import { RouterLink } from '../../RouterLink';
import { WordTokens } from '../types';

const PUNCTUATION: ReadonlyArray<string> = ['.', ',', '(', ')', '[', ']', '{', '}', '<', '>', ';', ':'];

const checkPunctuation = (idx: number, example: WordTokens, value: string) =>
  PUNCTUATION.includes(value) || (idx !== example.length - 1 && PUNCTUATION.includes(example[idx + 1].value))
    ? `${value}`
    : `${value} `;

const StyledReferenceLink = styled(Link.withComponent(RouterLink))<{ readonly code?: boolean }>`
  font-family: ${ifProp('code', "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace")};
  ${prop('theme.fontStyles.subheading')};
`;

interface Props {
  readonly to: string;
  readonly value: string;
  readonly idx: number;
  readonly example: WordTokens;
  readonly code?: boolean;
}

const ReferenceLink = ({ to, value, idx, example, code = false, ...props }: Props) => (
  <StyledReferenceLink to={to} linkColor="accent" code={code} key={idx} {...props}>
    {checkPunctuation(idx, example, value)}
  </StyledReferenceLink>
);

export const buildExample = (example: WordTokens) =>
  example.map((token, idx) =>
    token.slug === undefined ? (
      <span key={idx}>
        {new Parser().parse(
          Prism.highlight(checkPunctuation(idx, example, token.value), Prism.languages.typescript, 'typescript'),
          'text/xml',
        )}
      </span>
    ) : (
      <ReferenceLink to={token.slug} code idx={idx} value={token.value} example={example} />
    ),
  );

export const buildText = (example: WordTokens) =>
  example.map((token, idx) =>
    token.slug === undefined ? (
      <span key={idx}>{checkPunctuation(idx, example, token.value)}</span>
    ) : (
      <ReferenceLink to={token.slug} idx={idx} value={token.value} example={example} />
    ),
  );
