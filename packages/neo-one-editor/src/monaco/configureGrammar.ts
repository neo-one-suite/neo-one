/// <reference types="monaco-editor/monaco" />
import { IGrammar, INITIAL, Registry, StackElement } from 'monaco-textmate';
import { loadWASM } from 'onigasm';

// tslint:disable
// @ts-ignore
import onigasm from '!file-loader!../../node_modules/onigasm/lib/onigasm.wasm';
// @ts-ignore
import tsGrammar from '!raw-loader!./grammars/TypeScriptReact.tmLanguage';
// tslint:enable

class TokenizerState implements monaco.languages.IState {
  public constructor(private readonly _ruleStack: StackElement) {}

  public get ruleStack(): StackElement {
    return this._ruleStack;
  }

  public clone(): TokenizerState {
    return new TokenizerState(this._ruleStack);
  }

  public equals(other: monaco.languages.IState | undefined | null): boolean {
    if (!other || !(other instanceof TokenizerState) || other !== this || other._ruleStack !== this._ruleStack) {
      return false;
    }

    return true;
  }
}

// tslint:disable-next-line no-let
let grammar: Promise<IGrammar> | undefined;

export const configureGrammar = async (languageID: string) => {
  if (grammar === undefined) {
    grammar = loadWASM(onigasm).then(async () => {
      const registry = new Registry({
        getGrammarDefinition: async () => ({
          format: 'plist',
          content: tsGrammar,
        }),
      });

      return registry.loadGrammar('source.tsx');
    });
  }

  const grammarDefined = await grammar;

  monaco.languages.setTokensProvider(languageID, {
    getInitialState: () => new TokenizerState(INITIAL),
    tokenize: (line: string, state: TokenizerState) => {
      const res = grammarDefined.tokenizeLine(line, state.ruleStack);

      return {
        endState: new TokenizerState(res.ruleStack),
        tokens: res.tokens.map((token) => ({
          ...token,
          scopes: token.scopes[token.scopes.length - 1],
        })),
      };
    },
  });
};
