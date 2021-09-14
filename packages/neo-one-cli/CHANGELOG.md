# Change Log - @neo-one/cli

This log was last generated on Tue, 14 Sep 2021 21:24:27 GMT and should not be manually modified.

## 2.8.3
Tue, 14 Sep 2021 21:24:27 GMT

### Patches

- Bump NEO•ONE versions for patch publish

## 2.8.2
Tue, 15 Jun 2021 01:21:56 GMT

### Patches

- Minor fixes

## 2.7.2
Fri, 30 Apr 2021 01:53:33 GMT

*Version update only*

## 2.8.0
Tue, 23 Feb 2021 23:29:30 GMT

### Minor changes

- Add generate command, make more user friendly.

## 2.7.1
Wed, 02 Dec 2020 21:05:40 GMT

### Patches

- Fix synchronized-promise in browser.

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

