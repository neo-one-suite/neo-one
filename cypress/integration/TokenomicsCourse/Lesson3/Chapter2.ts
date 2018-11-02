import { ALL_SLUGS, lesson3, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 3 - Chapter 2', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson3({
    chapter: 2,
    error: "Cannot read property 'toNumber' of undefined",
    problems: [
      {
        owner: 'ts',
        text: `Type '{ name: string; symbol: string; amountPerNEO: BigNumber; totalSupply: BigNumber; remaining: BigNumber; icoStartTimeSeconds: BigNumber; icoDurationSeconds: BigNumber; }' is not assignable to type 'TokenInfoResult'.
        Property 'balance' is missing in type '{ name: string; symbol: string; amountPerNEO: BigNumber; totalSupply: BigNumber; remaining: BigNumber; icoStartTimeSeconds: BigNumber; icoDurationSeconds: BigNumber; }'.`,
        startLine: 35,
        endLine: 3,
      },
    ],
  });
});
