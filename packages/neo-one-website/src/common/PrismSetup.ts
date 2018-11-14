// tslint:disable
import '../../static/css/prism.css';
if (typeof window !== 'undefined') {
  require('clipboard');
}
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
if (typeof window !== 'undefined') {
  require('prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard');
}
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

export const PrismSetup = Prism;
