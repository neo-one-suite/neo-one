---
slug: 2020/07/23/neo-one-2-7-announcement
title: NEO•ONE 2.7 Announcement
author: The NEO•ONE Team
twitter: https://twitter.com/neo_one_suite
---

## NEO•ONE 2.7

We are excited to announce our latest [release](https://www.npmjs.com/package/@neo-one/cli) of NEO•ONE. For this release we have been focused on cleaning up bugs, adding new compiler features, expanding documentation, and preparing for future versions of NEO•ONE as we draw closer to the Neo3 release.

To get started with NEO•ONE you can install our CLI with
`yarn install @neo-one/cli`

## Compile

Starting with NEO•ONE 2.7 you will be able to output your compiled smart contract to various format types as well as generate debug information as per the spec listed [here](https://github.com/ngdseattle/design-notes/blob/master/NDX-DN11%20-%20NEO%20Debug%20Info%20Specification.md). We hope this will give our users more freedom in the end-to-end tooling they choose to use for developing their smart contracts. To get started with testing these new features you can use:

`yarn install @neo-one/cli`\
`yarn neo-one init`\
`yarn neo-one compile --json --avm --debug --opcodes`

For more information on how to enable AVM / debug generation use

`yarn neo-one compile --help`

or see the [pull request](https://github.com/neo-one-suite/neo-one/pull/2071).

### Further Work

While we have added the ability to output our compiled smart contracts as `.debug` and `.avm` files there is still work to be done to integrate these features with other tooling, like the Neo Blockchain Toolkit. See the PR linked above or visit the new issue page [here](https://github.com/neo-one-suite/neo-one/issues/2113) for more information. Also be sure to check out our [documentation](/docs/how-to-contribute#How-Can-I-Contribute) on building from source if you would like to help contribute to the project!

## Typescript Updates

In continuing with our efforts to keep NEO•ONE up to date with Typescript we have [updated](https://github.com/neo-one-suite/neo-one/pull/2063) the project to use TypeScript version 3.9.5. While there aren’t as many new features available in the compiler as our [last](https://github.com/neo-one-suite/neo-one/pull/1984) update we want to keep our feature set as familiar to new developers as we can, especially as we gear up for Neo3.

## Documentation

We’ve added several new sections of documentation to the website:

- [Deployment documentation](/docs/deployment)
- [The NEO•ONE CLI](/docs/CLI)
- [Network configuration](/docs/config-options)
- [Project contribution](/docs/how-to-contribute#How-Can-I-Contribute)
- [Compiler contribution](/docs/smart-contract-compiler)

Stumped on something and can’t find documentation for it? Feel free to submit a new [issue](https://github.com/neo-one-suite/neo-one/issues) to request it!

## Bug Fixes / Feature Changes

In NEO•ONE 2.7 several bugs have been fixed and features have been updated. You can see all the changes listed below.

- [#2056 Generated createClient does not wait For account setup](https://github.com/neo-one-suite/neo-one/pull/2056)
- [#2051 Update default network options](https://github.com/neo-one-suite/neo-one/pull/2051)
- [#2093 Fix switch-statement execution](https://github.com/neo-one-suite/neo-one/pull/2093)
- [#2095 Fix number mismatches in SetStorage, ArrayStorage and MapStorage](https://github.com/neo-one-suite/neo-one/pull/2095)
- [#2086 Export defaultnetwork helper from CLI](https://github.com/neo-one-suite/neo-one/pull/2086)
- [#2080 Fix missing type declarations in shipped packages](https://github.com/neo-one-suite/neo-one/pull/2091)
- [#2096 Fix ‘receive’ invocations when relaying transactions to a live network](https://github.com/neo-one-suite/neo-one/pull/2096)
- [#2112 Fix error when using typescript migration file for deployment](https://github.com/neo-one-suite/neo-one/pull/2112)
- [#2034 Update npm release process for smoother releases](https://github.com/neo-one-suite/neo-one/pull/2034)

## Future

NEO•ONE 2.7 will be the last milestone release for NEO•ONE 2.x, while small bug fixes and integration fixes (like https://github.com/neo-one-suite/neo-one/pull/2034) will continue to be released on the 2.x version our work will primarily focus on updating NEO•ONE to be compatible with the Neo3 protocol. Look out for the upcoming releases that will include Neo3 Preview, TestNet and MainNet compatibility.

Questions or concerns? Feel free to reach out to us on [GitHub](https://github.com/neo-one-suite/neo-one) or [Twitter](https://twitter.com/neo_one_suite)
