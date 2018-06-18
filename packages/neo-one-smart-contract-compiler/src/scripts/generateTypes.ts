// tslint:disable no-import-side-effect
import '@babel/polyfill';
import * as appRootDir from 'app-root-dir';
import * as fs from 'fs-extra';
import * as path from 'path';
import { BLOCKCHAIN_INTERFACES, SYSCALLS, TYPE_ALIASES } from '../compile/syscalls';

const run = async () => {
  const types = TYPE_ALIASES.map((alias) => `  ${alias.toDeclaration()}`).join('\n');
  const interfaces = BLOCKCHAIN_INTERFACES.map(
    (name) =>
      `  interface ${name} {
    __brand: '${name}';
  }`,
  ).join('\n');

  const syscalls = Object.values(SYSCALLS)
    .map((syscall) => `  ${syscall.toDeclaration()}`)
    .join('\n');

  const content = `declare global {
${types}
${interfaces}
${syscalls}
}

export {
  Address,
  Hash256,
  PublicKey,
  Signature,
  Fixed,
  Integer,
  Fixed8,
  SmartContract,
  MapStorage,
  SetStorage,
  Output,
  Input,
  AttributeUsage,
  Attribute,
  TransactionType,
  Transaction,
  BaseBlock,
  Header,
  Block,
  Account,
  AssetType,
  Asset,
  Contract,
  verifySender,
  getCurrentTransaction,
  getCurrentTime,
  getHeight,
  getHeader,
  getBlock,
  getTransaction,
  getAccount,
  getAsset,
  getValidators,
  getContract,
  verify,
  constant,
  createEventHandler,
} from './lib';
`;
  const filePath = path.resolve(appRootDir.get(), 'packages', 'neo-one-smart-contract', 'src', 'index.d.ts');
  await fs.writeFile(filePath, content);
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    // tslint:disable-next-line
    console.error(error);
    process.exit(1);
  });
