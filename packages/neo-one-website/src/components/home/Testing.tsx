import * as React from 'react';
import { styled } from 'reakit';
import { Markdown } from '../../elements';
import { AssetSectionGrid } from './AssetSectionGrid';

const example = `\`\`\`typescript
import { withContracts } from '../generated/test';

describe('Token', () => {
  test('has name, symbol and decimals properties', async () => {
    await withContracts(async ({ token }) => {
      const [name, symbol, decimals] = await Promise.all([token.name(), token.symbol(), token.decimals()]);
      expect(name).toEqual('Eon');
      expect(symbol).toEqual('EON');
      expect(decimals.toNumber()).toEqual(8);
    });
  });
});
\`\`\``;

const StyledMarkdown = styled(Markdown)`
  min-width: 0;
  min-height: 0;
  max-width: 100%;

  &&&& pre[class*='language-'] {
    margin-left: 0;
    margin-right: 0;
  }
`;

export function Testing() {
  return (
    <AssetSectionGrid title="Testing" asset={<StyledMarkdown source={example} />}>
      <div>
        Test smart contracts with human-friendly NEO•ONE client APIs. Each test runs a fresh full node and comes with
        handy utilities to enable scenarios like fast forwarding the node's block time to a point in the future.
      </div>
    </AssetSectionGrid>
  );
}
