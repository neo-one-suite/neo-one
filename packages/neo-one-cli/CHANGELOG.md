# Change Log - @neo-one/cli

This log was last generated on Thu, 07 Oct 2021 04:09:53 GMT and should not be manually modified.

## 3.9.0
Thu, 07 Oct 2021 04:09:53 GMT

### Minor changes

- Update neo-one dependencies

## 3.8.0
Thu, 23 Sep 2021 21:28:34 GMT

### Updates

- Updates for MainNet updates

## 3.1.0
Mon, 08 Feb 2021 21:00:42 GMT

### Minor changes

- Preview4 release

### Patches

- 3.0.1-preview3 release
- Update for Preview3, primarily in compiler, client, and CLI.
- Update compiler, client, and CLI for Preview4
- fixup cli start network command

## 3.0.0
Tue, 08 Dec 2020 19:29:01 GMT

### Breaking changes

- 3.0.0preview3-alpha release bump

## 2.7.0
Thu, 23 Jul 2020 22:11:12 GMT

### Minor changes

- Adds outDir to neo-one config for output directory path of compile command. Adds E2E test for compile command.
- add debug support
- Export createUserAccountProviderFunc.
- Remove @neotracker/core as a @neo-one/cli dependency.

### Patches

- Add appropriate @types dependencies.
- patch migration.ts file transpiling
- Update NEO Tracker dependency.
- Update CLI compile options.
- Upgrade TypeScript from v3.8.3 to v3.9.5

### Updates

- Add E2E test for neo-one init command.
- bump package version for future release clarity

## 2.6.0
Wed, 20 May 2020 07:03:14 GMT

### Minor changes

- update package release process to take better advantage of rush tooling

## 2.5.0
Mon, 13 Apr 2020 23:20:32 GMT

### Minor changes

- add 'compile' command to cli
- Migrate to Rush
- Upgrade TS to v3.8.1-rc

### Patches

- Minor bug fix. `yarn neo-one build` would start a NEO Tracker instance, even if config specified to skip NEO Tracker.
- update dependencies
- Add e2e exchange test based on switcheo
- update @types/react to 16.9.14

