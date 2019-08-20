import styled from '@emotion/styled';
import * as React from 'react';
import { ifProp, prop } from 'styled-tools';
import { Prism } from '../../../common';
import { StyledRouterLink } from '../../StyledRouterLink';
import { WordToken, WordTokens } from '../types';

const PUNCTUATION: readonly string[] = ['.', ',', '(', ')', '[', ']', '{', '}', '<', '>', ';', ':'];

const checkPunctuation = (idx: number, example: WordTokens, value: string) =>
  PUNCTUATION.includes(value) || (idx !== example.length - 1 && PUNCTUATION.includes(example[idx + 1].value))
    ? `${value}`
    : `${value} `;

const StyledReferenceLink = styled<typeof StyledRouterLink, { readonly code?: boolean }>(StyledRouterLink)`
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

const getHighlightedHtml = ({
  idx,
  example,
  token,
}: {
  readonly idx: number;
  readonly example: WordTokens;
  readonly token: WordToken;
}): { readonly __html: string } => ({
  __html: Prism.highlight(checkPunctuation(idx, example, token.value), Prism.languages.typescript, 'typescript'),
});

export const buildExample = (example: WordTokens) =>
  example.map((token, idx) =>
    token.slug === undefined ? (
      <span key={idx} dangerouslySetInnerHTML={getHighlightedHtml({ idx, example, token })}></span>
    ) : (
      <ReferenceLink key={idx} to={token.slug} code idx={idx} value={token.value} example={example} />
    ),
  );

export const buildText = (example: WordTokens) =>
  example.map((token, idx) =>
    token.slug === undefined ? (
      <span key={idx}>{checkPunctuation(idx, example, token.value)}</span>
    ) : (
      <ReferenceLink key={idx} to={token.slug} idx={idx} value={token.value} example={example} />
    ),
  );
