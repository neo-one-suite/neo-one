import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
// @ts-ignore
import container from 'markdown-it-container';
// @ts-ignore
import table from 'markdown-it-multimd-table';
import * as React from 'react';
import { css, styled } from 'reakit';
import slugify from 'slugify';
import { ifProp, prop, switchProp } from 'styled-tools';
import { markdownTOC } from './markdownTOC';

// tslint:disable
import '../../static/css/prism.css';
import 'clipboard';
// @ts-ignore
import Prism from 'prismjs/components/prism-core';
// @ts-ignore
const _WorkerGlobalScope = typeof WorkerGlobalScope === 'undefined' ? undefined : WorkerGlobalScope;
// tslint:disable-next-line no-any
const _self: any =
  typeof window !== 'undefined'
    ? window // if in browser
    : // @ts-ignore
    _WorkerGlobalScope !== undefined && self instanceof _WorkerGlobalScope
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
// @ts-ignore
import 'prismjs/components/prism-jsx';
import './prismBash';

Prism.languages.typescript = Prism.languages.extend('javascript', {
  // From JavaScript Prism keyword list and TypeScript language spec: https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md#221-reserved-words
  keyword: /\b(?:as|await|break|case|catch|continue|debugger|default|do|else|export|finally|for|from|if|import|in|instanceof|of|return|switch|throw|try|while|with|yield|require)\b/,
  keywordBlue: /\b(?:async|class|const|delete|enum|extends|function|get|implements|interface|let|new|package|private|protected|public|set|static|super|this|typeof|var|module|declare|constructor|namespace|abstract|type|readonly)\b/,
  builtin: /\b(?:string|Function|any|number|boolean|Array|symbol|console|void|null)\b/,
});
Prism.languages.ts = Prism.languages.typescript;
const typescript = Prism.util.clone(Prism.languages.typescript);
Prism.languages.tsx = Prism.languages.extend('jsx', typescript);
// tslint:enable

const langPrefix = 'language-';

const createMD = ({ withAnchors }: { readonly withAnchors: boolean }) => {
  const md = MarkdownIt();
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
    .use(markdownTOC, {
      slugify,
      includeLevel: [2],
      name: 'toc',
    })
    .use(markdownTOC, {
      slugify,
      markerPattern: /^\[\[toc-reference\]\]/im,
      format: (content: string) => md.render(content).slice(3, -5),
      includeLevel: [4, 5],
      name: 'toc_reference',
      subTOC: true,
    })
    .use(container, 'warning', {
      // tslint:disable-next-line:no-any
      render: (tokens: any, idx: any) => {
        if (tokens[idx].type === 'container_warning_open') {
          return '<blockquote class="warning">';
        }

        return '</blockquote>\n';
      },
    })
    .use(table);

  if (withAnchors) {
    // tslint:disable-next-line no-any
    md.use(anchor as any, {
      permalink: true,
      slugify,
      level: [2, 3, 4, 5],
    });
  }

  return md;
};

const mdWithoutAnchors = createMD({ withAnchors: false });
const mdWithAnchors = createMD({ withAnchors: true });

const headerMargins = css`
  margin-top: 32px;
  margin-bottom: 24px;
`;

const lightCode = css`
  background-color: ${prop('theme.gray1')};
  color: ${prop('theme.black')};
  padding: 4px;
  border-radius: 4px;
`;

const stretchCSS = css`
  margin-left: -24px;
  margin-right: -24px;
`;

const Wrapper = styled.div<{ readonly linkColor: 'primary' | 'gray' | 'accent'; readonly light: boolean }>`
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
    ${prop('theme.fontStyles.subheading')};
    ${headerMargins};
  }

  & h6 {
    ${prop('theme.fontStyles.body2')};
    ${headerMargins};
  }

  & p {
    margin-bottom: 16px;
    margin-top: 16px;
  }

  & a {
    color: ${switchProp('linkColor', {
      primary: prop('theme.primary'),
      accent: prop('theme.accent'),
      gray: prop('theme.gray6'),
    })};
    ${prop('theme.fonts.axiformaBold')};
    ${prop('theme.fontStyles.subheading')};
    text-decoration: none;
  }

  & a code {
    color: ${switchProp('linkColor', {
      primary: prop('theme.primary'),
      accent: prop('theme.accent'),
      gray: prop('theme.gray6'),
    })};
  }

  & a:hover {
    color: ${prop('theme.primaryDark')};
    text-decoration: none;
  }

  & a:hover code {
    color: ${prop('theme.primaryDark')};
  }

  & a:focus {
    color: ${prop('theme.primaryDark')};
    text-decoration: none;
  }

  & a:focus code {
    color: ${prop('theme.primaryDark')};
  }

  & a:active {
    color: ${prop('theme.primaryDark')};
    text-decoration: none;
  }

  & a:active code {
    color: ${prop('theme.primaryDark')};
  }

  & hr {
    border-bottom: 1px solid rgba(255, 255, 255, 0.075);
    margin-bottom: 8px;
    margin-top: 32px;
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

  & li {
    margin-top: 8px;
  }

  & pre {
    margin-bottom: 16px;
    margin-top: 16px;
    white-space: pre-wrap;
  }

  & code {
    ${ifProp('light', lightCode, '')};
    ${prop('theme.fontStyles.subheading')};
    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    white-space: nowrap;
  }

  & .header-anchor {
    vertical-align: top;
  }

  & blockquote.warning {
    background-color: rgba(255, 229, 100, 0.3);
    border-left-color: #ffe564;
    border-left-width: 8px;
    border-left-style: solid;
    padding: 16px 40px 16px 24px;
    margin-bottom: 24px;
    margin-top: 16px;
    ${stretchCSS};
  }

  & blockquote.warning p {
    margin-top: 0;
    margin-bottom: 0;
  }

  & blockquote.warning p:first-of-type {
    ${prop('theme.fonts.axiformaBold')};
  }
`;

interface Props {
  readonly source: string;
  readonly linkColor?: 'primary' | 'gray' | 'accent';
  readonly openAllLinksInNewTab?: boolean;
  readonly light?: boolean;
  readonly anchors?: boolean;
}
export class Markdown extends React.Component<Props> {
  private readonly ref = React.createRef<HTMLElement>();

  public componentDidMount(): void {
    if (this.ref.current) {
      Prism.highlightAllUnder(this.ref.current);

      const anchors = this.ref.current.getElementsByTagName('a');
      // tslint:disable-next-line no-loop-statement prefer-for-of
      for (let i = 0; i < anchors.length; i += 1) {
        const a = anchors[i];
        if (this.props.openAllLinksInNewTab) {
          // tslint:disable-next-line no-object-mutation
          a.target = '_blank';
        } else if (a.host !== window.location.host) {
          // tslint:disable-next-line no-object-mutation
          a.target = '_blank';
        }
      }
    }
  }

  public componentDidUpdate(): void {
    if (this.ref.current) {
      Prism.highlightAllUnder(this.ref.current);
    }
  }

  public render() {
    const { source, linkColor = 'primary', light = false, anchors = false, ...props } = this.props;

    return (
      <Wrapper
        {...props}
        linkColor={linkColor}
        light={light}
        innerRef={this.ref}
        dangerouslySetInnerHTML={{ __html: anchors ? mdWithAnchors.render(source) : mdWithoutAnchors.render(source) }}
      />
    );
  }
}
