// tslint:disable no-floating-promises no-default-export no-implicit-dependencies export-name
import BigNumber from 'bignumber.js';
import { MigrationContracts } from '../codegen';

export default ({ token, ico, coin, coinIco }: MigrationContracts, _network: string) => {
  token.deploy();
  coin.deploy();
  ico.deploy(undefined, new BigNumber(1566864121), undefined);
  coinIco.deploy(undefined, new BigNumber(1566864121), undefined);
};
