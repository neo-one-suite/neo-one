/* @flow */
import { type InteractiveCommand } from '@neo-one/server-common';
import { type ResourceType, Plugin } from '@neo-one/server';

import { constants as networkConstants } from '@neo-one/server-plugin-network';

import WalletResourceType from './WalletResourceType';

import activateWallet from './activateWallet';
import constants from './constants';
import deactivateWallet from './deactivateWallet';

export default class WalletPlugin extends Plugin {
  walletResourceType: WalletResourceType = new WalletResourceType({
    plugin: this,
  });

  get name(): string {
    return constants.PLUGIN;
  }

  get names(): {|
    capital: string,
    capitalPlural: string,
    lower: string,
    lowerPlural: string,
  |} {
    return {
      capital: 'Wallet',
      capitalPlural: 'Wallets',
      lower: 'wallet',
      lowerPlural: 'wallets',
    };
  }

  get dependencies(): Array<string> {
    return [networkConstants.PLUGIN];
  }

  get resourceTypes(): Array<ResourceType<*, *>> {
    return [this.walletResourceType];
  }

  get interactive(): Array<InteractiveCommand> {
    return [activateWallet(this), deactivateWallet(this)];
  }
}
