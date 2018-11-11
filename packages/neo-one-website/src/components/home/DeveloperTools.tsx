import * as React from 'react';
import developerTools from '../../../static/img/developerTools.png';
import { AssetImage } from './AssetImage';
import { AssetSectionGrid } from './AssetSectionGrid';

export function DeveloperTools() {
  return (
    <AssetSectionGrid title="Developer Tools" asset={<AssetImage src={developerTools} />}>
      <div>
        NEO•ONE's Developer Tools makes developing a decentralized application easier, faster and much more satisfying.
        Developers can switch between preloaded local development wallets, fast forward the current block time, access
        links to a local NEO Tracker instance and more.
      </div>
    </AssetSectionGrid>
  );
}
