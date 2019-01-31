import * as fs from 'fs-extra';
import * as path from 'path';

export const reportError = async (logFilePath: string) => {
  const serverLogFile = path.resolve(logFilePath, 'server/server.log');

  try {
    const contents = await fs.readFile(serverLogFile, 'utf8');
    const maxLines = 10;

    const lines = contents.split('\n').filter((line) => line.length > 1);
    const output = lines.slice(-maxLines);

    /* tslint:disable-next-line:no-console */
    console.log(`\n\nLast ${maxLines} entries of server log:\n${serverLogFile}\n`, output.join('\n'));
  } catch {
    /* tslint:disable-next-line:no-console */
    console.error(`\nError reading server log: ${serverLogFile}\n`);
  }
};
