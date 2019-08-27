// tslint:disable no-floating-promises no-default-export no-implicit-dependencies export-name
import BigNumber from 'bignumber.js';
import { MigrationContracts } from '../codegen';

export default ({ token, ico, escrow }: MigrationContracts, _network: string) => {
  token.deploy();
  ico.deploy(undefined, new BigNumber(1566864121), undefined);
  escrow.deploy();
};
