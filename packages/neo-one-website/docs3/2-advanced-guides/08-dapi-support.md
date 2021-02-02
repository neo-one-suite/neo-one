---
slug: dapi-support
title: dAPI Support
---

NEO•ONE provides dAPI support through the familiar [User Accounts](/docs/user-accounts) interface.

---

[[toc]]

---

## What is the dAPI?

The dAPI is an interface for interacting with the NEO blockchain using an existing dAPI enabled wallet provider. This means that actions like transferring NEO, claiming GAS, and invoking smart contracts can be handled by a trusted wallet provider without the user every having to give a new dApp access to their private key. This allows developers to focus on the development of their dApp without having to worry about the complexities and security concerns of managing user accounts.

## DapiUserAccountProvider

NEO•ONE abstracts away the dAPI into a `DapiUserAccountProvider`, an implementation of the [UserAccountProvider](/reference/@neo-one/client/useraccountprovider) interface. While the [LocalUserAccountProvider](/reference/@neo-one/client/localuseraccountprovider) provides a [Client](/reference/@neo-one/client/client) access to [User Accounts](/docs/user-accounts) stored locally, the `DapiUserAccountProvider` provides access to [User Accounts](/docs/user-accounts) stored by a wallet provider and accessed through the dAPI.

To set up a `DapiUserAccountProvider`, simply import `neo-dapi` in your entry point and ensure it has been attached to the global object. We recommend using the [globalThis](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis) as it is compatible across environments. Once the `neo-dapi` has been attached to the global object, it can be passed from the global object into the constructor of a new `DapiUserAccountProvider`. With this setup, a dAPI enabled wallet running in the background will automatically be used to handle any `UserAccountProvider` methods. The `DapiUserAccountProvider` can then be used in place of a `LocalUserAccountProvider` when setting up a NEO•ONE `Client` as detailed in the [User Accounts](/docs/user-accounts) section.

Entry point:

```typescript
import neoDapi from 'neo-dapi';

// Attach the neo-dapi to the global object at the entry point
globalThis.neoDapi = neoDapi;
```

Elsewhere:

```typescript
import { Client, DapiUserAccountProvider } from '@neo-one/client';

...

const dapiUserAccountProvider = new DapiUserAccountProvider({
  // Use the global object to pass the neo-dapi to a DapiUserAccountProvider
  dapi: globalThis.neoDapi,
  provider,
  onError: (error) => {
    throw error;
  },
});

// Use the DapiUserAccountProvider to create a Client
const client = new Client({ dapi: dapiUserAccountProvider });
```

## Codegen

If you're using NEO•ONE to compile smart contracts and/or generate code with the `neo-one build` command, setting up the dAPI is even easier. Just make sure to attach the `neo-dapi` to the global object at your project's entry point and have a dAPI enabled wallet running in the background. The rest will be taken care of for you when you run `neo-one build`. The generated `Client` will automatically detect the `neo-dapi` attached to the global object and provide it access to a `DapiUserAccountProvider`. Note: This feature is only available with node version >= 12.

## RemoteUserAccountProvider

If for some reason the dAPI does not suit the needs for your dApp, NEO•ONE also provides a general `RemoteUserAccountProvider`. This allows communication between a `RemoteUserAccountProvider` in a dApp and a [UserAccountProvider](/reference/@neo-one/client/useraccountprovider) in a wallet through a [Message Channel](https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel) interface. To use as `RemoteUserAccountProvider`, a wallet provider must implement a [UserAccountProvider](/reference/@neo-one/client/useraccountprovider), such as a [LocalUserAccountProvider](/reference/@neo-one/client/localuseraccountprovider) and call `connectRemoteUserAccountProvider` with the [UserAccountProvider](/reference/@neo-one/client/useraccountprovider) and the [Message Port](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort) to define the channel. On the dApp's side, all that is required is to create a new `RemoteUserAccountProvider` with the other [Message Port](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort). Note this feature should only be used in cases where the dAPI is insufficient, as the dAPI is the official standard for the NEO blockchain. If you'd like to use a `RemoteUserAccountProvider`, please contact us so we can work with you to ensure it meets the needs of your dApp.
