import { createHash } from 'crypto';
import fs from 'fs-extra';

const hashRegex = /@hash ([0-9a-z-]+)/;

export const writeFile = async (filePath: string, contents?: string) => {
  if (contents === undefined) {
    return;
  }

  const exists = await fs.pathExists(filePath);
  const hash = createHash('md5').update(contents).digest('hex');
  if (exists) {
    const currentContents = await fs.readFile(filePath, 'utf8');
    const match = hashRegex.exec(currentContents);
    // tslint:disable-next-line possible-timing-attack
    if (match !== null && match[1] === hash) {
      return;
    }
  }

  await fs.writeFile(filePath, `/* @hash ${hash} */\n${contents}`);
};
