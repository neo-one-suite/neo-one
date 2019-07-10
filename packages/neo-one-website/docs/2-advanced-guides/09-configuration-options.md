---
slug: config-options
title: Configuration Options
---
NEO•ONE compiler configuration options

Configure NEO•ONE for your project.

## Config File

An [initialized environment](https://neo-one.io/tutorial#Setup-for-the-Tutorial) will have a ` .onerc ` file within the project root.

### Example NEO•ONE configuration file

The `.onerc` configuration file may look something like this:
```json
{
  "codegen": {
    "language": "typescript",
    "framework": "react",
    "browser":  false
  },
  "paths": {
    "contracts": "one/contracts",
    "generated": "one/generated"
  },
}
```

### `codegen`

Keys with `codegen` allow you to configure which `language`, front-end `framework` and whether to compile with `browser` compatibility.
* `language`: `string` =  `typescript` | `javascript`, Default: `typescript`
* `framework`: `string` =  `none` | `react` | `vue` | `angular`, Default: `none`
* `browser`:  `boolean` = `true` | `false`, Default: `false`

When "browser" is true NEO-ONE generates pre-bundled browser-compatible code by referencing `@neo-one/client-browserify` instead of `@neo-one/client`.  Note, this option is intended for use with react-native based frameworks such as Expo which do not allow nodejs builtin modules.

### `paths`
There are two options within `path` which define where NEO•ONE will look for smart contracts to compile and where it will output generated code.
* `contracts`: `string` - where to find smart contracts to compile. Defaults to one/contracts.
* `generated`: `string` - where generated compiled code will be put. Defaults to one/generated.

