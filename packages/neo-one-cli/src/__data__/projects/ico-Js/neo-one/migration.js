// tslint:disable no-floating-promises no-default-export no-implicit-dependencies export-name
import BigNumber from 'bignumber.js';

export default ({ token, ico, escrow }, _network) => {
  token.deploy();
  ico.deploy(undefined, new BigNumber(1566864121), undefined);
  escrow.deploy();
};
