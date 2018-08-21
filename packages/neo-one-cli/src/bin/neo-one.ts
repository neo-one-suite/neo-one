import {
  CLI,
  DIR_OPTION,
  HTTP_SERVER_PORT_OPTION,
  InteractiveCLI,
  MIN_PORT_OPTION,
  SERVER_PORT_OPTION,
  STATIC_NEO_ONE_OPTION,
  // tslint:disable-next-line no-implicit-dependencies
} from '@neo-one/cli';

// tslint:disable-next-line no-let
let { argv } = process;
const debugIdx = argv.indexOf('--debug');
const debug = debugIdx !== -1;
if (debug) {
  argv = argv.slice(0, debugIdx).concat(argv.slice(debugIdx + 1));
}

const staticIdx = argv.indexOf(STATIC_NEO_ONE_OPTION);
const isStatic = staticIdx !== -1;
if (isStatic) {
  argv = argv.slice(0, staticIdx).concat(argv.slice(staticIdx + 1));
}

const quoteArgs = (args: ReadonlyArray<string>): ReadonlyArray<string> =>
  args.map((arg, idx) => {
    if (idx === 0) {
      return arg;
    }

    if (arg.includes(' ')) {
      return `"${arg}"`;
    }

    return arg;
  });

// tslint:disable-next-line readonly-array
const extractOption = (argsIn: string[], option: string): [string[], string | undefined] => {
  let args = argsIn;
  const index = args.indexOf(option);
  let value;
  if (index !== -1) {
    value = args[index + 1];
    args = args.slice(0, index).concat(args.slice(index + 2));
  }

  return [args, value];
};

// tslint:disable-next-line no-let
let result = extractOption(argv, DIR_OPTION);
[argv] = result;
const dir = result[1];

result = extractOption(argv, SERVER_PORT_OPTION);
[argv] = result;
const serverPortOut = result[1];
const serverPort = serverPortOut === undefined ? undefined : parseInt(serverPortOut, 10);

result = extractOption(argv, HTTP_SERVER_PORT_OPTION);
[argv] = result;
const httpServerPortOut = result[1];
const httpServerPort = httpServerPortOut === undefined ? undefined : parseInt(httpServerPortOut, 10);

result = extractOption(argv, MIN_PORT_OPTION);
[argv] = result;
const minPortOut = result[1];
const minPort = minPortOut === undefined ? undefined : parseInt(minPortOut, 10);

if (isStatic) {
  // tslint:disable-next-line no-floating-promises
  new CLI({
    debug,
    dir,
    serverPort,
    httpServerPort,
    minPort,
  }).start(quoteArgs(argv));
} else {
  // tslint:disable-next-line no-floating-promises
  new InteractiveCLI({
    debug,
    dir,
    serverPort,
    httpServerPort,
    minPort,
  }).start(quoteArgs(argv));
}
