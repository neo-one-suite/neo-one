/* @flow */
import { DescribeCRUD } from '@neo-one/server';
import { type InteractiveCLI } from '@neo-one/server-common';

import type WalletResourceType, {
  Wallet,
  WalletResourceOptions,
} from '../WalletResourceType';

import common from './common';

export default class DescribeWalletCRUD extends DescribeCRUD<
  Wallet,
  WalletResourceOptions,
> {
  constructor({ resourceType }: {| resourceType: WalletResourceType |}) {
    super({
      resourceType,
      options: common.options,
    });
  }

  getCLIName(options: {|
    baseName: string,
    cli: InteractiveCLI,
    options: WalletResourceOptions,
  |}): Promise<string> {
    return common.getCLIName(options);
  }

  getCLIResourceOptions(options: {|
    cli: InteractiveCLI,
    // flowlint-next-line unclear-type:off
    options: Object,
  |}): Promise<WalletResourceOptions> {
    return common.getCLIResourceOptions(options);
  }
}
