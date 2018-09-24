// tslint:disable no-array-mutation promise-function-async
import * as fs from 'fs-extra';
import * as path from 'path';
import webpack from 'webpack';

const TYPESCRIPT_LIB_SOURCE = path.resolve(__dirname, '..', '..', '..', '..', 'node_modules', 'typescript', 'lib');

// tslint:disable-next-line export-name
export function libDTSLoader(this: webpack.loader.LoaderContext) {
  try {
    compile(this);
  } catch (e) {
    // tslint:disable-next-line no-console
    console.error(e, e.stack);
    throw e;
  }
}

const compile = (loader: webpack.loader.LoaderContext): void => {
  const callback = loader.async();
  if (callback) {
    getSource()
      .then((result) => callback(undefined, result))
      .catch(callback);
  }
};

const getSource = async (): Promise<string> => {
  function getFileName(name: string) {
    return name === '' ? 'lib.d.ts' : `lib.${name}.d.ts`;
  }
  function getVariableName(name: string) {
    return name === '' ? 'lib_dts' : `lib_${name.replace(/\./g, '_')}_dts`;
  }
  function readLibFile(name: string) {
    const srcPath = path.join(TYPESCRIPT_LIB_SOURCE, getFileName(name));

    return fs.readFile(srcPath, 'utf8');
  }

  const mutableQueue: string[] = [];
  const seen = new Set<string>();

  const enqueue = (name: string) => {
    if (seen.has(name)) {
      return;
    }
    seen.add(name);
    mutableQueue.push(name);
  };

  enqueue('');
  enqueue('esnext');

  const result = [];
  // tslint:disable-next-line no-loop-statement
  while (mutableQueue.length > 0) {
    const name = mutableQueue.shift();
    if (name === undefined) {
      break;
    }

    const contents = await readLibFile(name);
    const lines = contents.split(/\r\n|\r|\n/);

    let output = '';
    const writeOutput = (text: string) => {
      if (output.length === 0) {
        output = text;
      } else {
        output += ` + ${text}`;
      }
    };
    let mutableOutputLines: string[] = [];
    const flushOutputLines = () => {
      writeOutput(`"${escapeText(mutableOutputLines.join('\n'))}"`);
      mutableOutputLines = [];
    };
    const deps = [];
    // tslint:disable-next-line no-loop-statement prefer-for-of
    for (let i = 0; i < lines.length; i += 1) {
      const m = lines[i].match(/\/\/\/\s*<reference\s*lib="([^"]+)"/);
      if (m) {
        flushOutputLines();
        writeOutput(getVariableName(m[1]));
        deps.push(getVariableName(m[1]));
        enqueue(m[1]);
        continue;
      }
      mutableOutputLines.push(lines[i]);
    }
    flushOutputLines();

    result.push({
      name: getVariableName(name),
      deps,
      output,
    });
  }

  let strResult = '';
  // tslint:disable-next-line no-loop-statement
  while (result.length > 0) {
    // tslint:disable-next-line no-loop-statement
    for (let i = result.length - 1; i >= 0; i -= 1) {
      if (result[i].deps.length === 0) {
        // emit this node
        strResult += `\nvar ${result[i].name} = ${result[i].output};\nmodule.exports.${result[i].name} = ${
          result[i].name
        };\n`;

        // mark dep as resolved
        // tslint:disable-next-line no-loop-statement prefer-for-of
        for (let j = 0; j < result.length; j += 1) {
          // tslint:disable-next-line no-loop-statement
          for (let k = 0; k < result[j].deps.length; k += 1) {
            if (result[j].deps[k] === result[i].name) {
              result[j].deps.splice(k, 1);
              break;
            }
          }
        }

        // remove from result
        result.splice(i, 1);
        break;
      }
    }
  }

  return strResult;
};

function escapeText(text: string): string {
  // See http://www.javascriptkit.com/jsref/escapesequence.shtml
  const backspace = '\b'.charCodeAt(0);
  const formFeed = '\f'.charCodeAt(0);
  const newLine = '\n'.charCodeAt(0);
  const nullChar = 0;
  const carriageReturn = '\r'.charCodeAt(0);
  const tab = '\t'.charCodeAt(0);
  const verticalTab = '\v'.charCodeAt(0);
  const backslash = '\\'.charCodeAt(0);
  const doubleQuote = '"'.charCodeAt(0);

  let startPos = 0;
  let replaceWith: string | undefined;
  const mutableResultPieces: string[] = [];
  const length = text.length;

  // tslint:disable-next-line no-loop-statement
  for (let i = 0; i < length; i += 1) {
    const chrCode = text.charCodeAt(i);
    switch (chrCode) {
      case backspace:
        replaceWith = '\\b';
        break;
      case formFeed:
        replaceWith = '\\f';
        break;
      case newLine:
        replaceWith = '\\n';
        break;
      case nullChar:
        replaceWith = '\\0';
        break;
      case carriageReturn:
        replaceWith = '\\r';
        break;
      case tab:
        replaceWith = '\\t';
        break;
      case verticalTab:
        replaceWith = '\\v';
        break;
      case backslash:
        replaceWith = '\\\\';
        break;
      case doubleQuote:
        replaceWith = '\\"';
        break;
      default:
      // do nothing
    }
    if (replaceWith !== undefined) {
      mutableResultPieces.push(text.substring(startPos, i));
      mutableResultPieces.push(replaceWith);
      startPos = i + 1;
      replaceWith = undefined;
    }
  }

  mutableResultPieces.push(text.substring(startPos, length));

  return mutableResultPieces.join('');
}
