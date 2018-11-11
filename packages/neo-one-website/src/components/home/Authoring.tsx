import * as React from 'react';
import authoring from '../../../static/img/authoring.png';
import { AssetImage } from './AssetImage';
import { AssetSectionGrid } from './AssetSectionGrid';

export function Authoring() {
  return (
    <AssetSectionGrid title="Authoring" asset={<AssetImage src={authoring} />}>
      <div>
        Authoring smart contracts has never been easier. First class TypeScript integration means that smart contracts
        are strongly typed and will never leave you guessing at what's supported. Write idiomatic TypeScript with inline
        compiler diagnostics using the NEO•ONE TypeScript plugin.
      </div>
    </AssetSectionGrid>
  );
}
