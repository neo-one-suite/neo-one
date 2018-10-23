/// <reference lib="webworker" />
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
// @ts-ignore
import TOC from 'markdown-it-table-of-contents';
import * as React from 'react';
import { css, styled } from 'reakit';
import { prop } from 'styled-tools';

// tslint:disable
import '../../static/css/prism.css';
import 'clipboard';
// @ts-ignore
import Prism from 'prismjs/components/prism-core';
// tslint:disable-next-line no-any
const _self: any =
  typeof window !== 'undefined'
    ? window // if in browser
    : typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope
      ? self // if in worker
      : {}; // if in node js
_self.Prism = Prism;
import 'prismjs/plugins/toolbar/prism-toolbar.css';
import 'prismjs/plugins/toolbar/prism-toolbar';
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard';
// @ts-ignore
import 'prismjs/components/prism-clike';
// @ts-ignore
import 'prismjs/components/prism-javascript';
// @ts-ignore
import 'prismjs/components/prism-markup';

Prism.languages.typescript = Prism.languages.extend('javascript', {
  // From JavaScript Prism keyword list and TypeScript language spec: https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md#221-reserved-words
  keyword: /\b(?:as|await|break|case|catch|continue|debugger|default|do|else|export|finally|for|from|if|import|in|instanceof|of|return|switch|throw|try|while|with|yield|require)\b/,
  keywordBlue: /\b(?:async|class|const|delete|enum|extends|function|get|implements|interface|let|new|package|private|protected|public|set|static|super|this|typeof|var|module|declare|constructor|namespace|abstract|type|readonly)\b/,
  builtin: /\b(?:string|Function|any|number|boolean|Array|symbol|console|void|null)\b/,
});
Prism.languages.ts = Prism.languages.typescript;
// tslint:enable

const md = MarkdownIt();

const langPrefix = 'language-';
md.set({
  html: false,
  xhtmlOut: false,
  breaks: false,
  langPrefix,
  linkify: true,
  typographer: true,
  quotes: `""''`,
  highlight: (text, lang) => {
    const code = md.utils.escapeHtml(text);
    const classAttribute = lang ? ` class="${langPrefix}${lang}"` : '';

    return `<pre${classAttribute}><code${classAttribute}>${code}</code></pre>`;
  },
})
  // tslint:disable-next-line no-any
  .use(anchor as any)
  .use(TOC, { includeLevel: [2] });

const headerMargins = css`
  margin-top: 24px;
  margin-bottom: 24px;
`;

const Wrapper = styled.div`
  ${prop('theme.fontStyles.subheading')};
  ${prop('theme.fonts.axiformaThin')};
  overflow-wrap: break-word;

  & h1 {
    ${prop('theme.fontStyles.display2')};
    margin-top: 16px;
    margin-bottom: 24px;
  }

  & h2 {
    ${prop('theme.fontStyles.display1')};
    ${headerMargins};
  }

  & h3 {
    ${prop('theme.fontStyles.headline')};
    ${headerMargins};
  }

  & h4 {
    ${prop('theme.fontStyles.subheading')};
    ${headerMargins};
  }

  & h5 {
    ${prop('theme.fontStyles.body2')};
    ${headerMargins};
  }

  & h6 {
    ${prop('theme.fontStyles.body1')};
    ${headerMargins};
  }

  & p {
    margin-bottom: 16px;
    margin-top: 16px;
  }

  & a {
    color: ${prop('theme.primary')};
    ${prop('theme.fonts.axiformaBold')};
    ${prop('theme.fontStyles.subheading')};
    text-decoration: none;
  }

  & a:hover {
    color: ${prop('theme.primaryDark')};
    text-decoration: none;
  }

  & a:focus {
    color: ${prop('theme.primaryDark')};
    text-decoration: none;
  }

  & a:active {
    color: ${prop('theme.primaryDark')};
    text-decoration: none;
  }

  & hr {
    border: 'none';
    border-bottom: 1px solid rgba(255, 255, 255, 0.075);
    margin-bottom: 8px;
    margin-top: 8px;
  }

  & strong: {
    font-weight: ${prop('theme.fontStyles.axiformaMedium')};
  }

  & blockquote {
    border-left: 5px solid rgba(255, 255, 255, 0.12);
    margin-bottom: 16px;
    margin-left: 0;
    margin-right: 24px;
    margin-top: 16px;
    padding-left: 16px;
  }

  & ul {
    margin-bottom: 8px;
    margin-top: 8px;
    padding-left: 24px;
  }

  & ol {
    margin-bottom: 8px;
    margin-top: 8px;
    padding-left: 24px;
  }

  & pre {
    margin-bottom: 16px;
    margin-top: 16px;
    white-space: pre-wrap;
  }

  & code {
    ${prop('theme.fontStyles.subheading')};
    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  }
`;

interface Props {
  readonly source: string;
}
export class Markdown extends React.Component<Props> {
  private readonly ref = React.createRef<HTMLElement>();

  public componentDidMount(): void {
    if (this.ref.current) {
      Prism.highlightAllUnder(this.ref.current);
    }
  }

  public componentDidUpdate(): void {
    if (this.ref.current) {
      Prism.highlightAllUnder(this.ref.current);
    }
  }

  public render() {
    const { source, ...props } = this.props;

    return <Wrapper {...props} innerRef={this.ref} dangerouslySetInnerHTML={{ __html: md.render(source) }} />;
  }
}
