// tslint:disable no-floating-promises no-default-export no-implicit-dependencies export-name
import { UserAccountID } from '@neo-one/client';
import BigNumber from 'bignumber.js';
import { MigrationContracts } from '../codegen';

export default (
  { token, ico, escrow }: MigrationContracts,
  _network: string,
  userAccountIDs: readonly UserAccountID[],
) => {
  token.deploy();
  ico.deploy(userAccountIDs[1].address, new BigNumber(1566864121), undefined, { from: userAccountIDs[1] });
  escrow.deploy();
};
