---
slug: react
title: React
---

NEO•ONE has first-class integration with React applications.

Integrating NEO•ONE with React is a breeze using the generated NEO•ONE client APIs. We also offer a `FromStream` component that make using `Observable`s in the client APIs within your React components much simpler.

---

[[toc]]

---

## Generated Code

The NEO•ONE toolchain emits two components that aid in integrating a React application with NEO•ONE: `ContractsProvider` and `WithContracts`.

### ContractProvider

The `ContractsProvider` component should be used at the root of your application as it provides the NEO•ONE client and smart contract APIs to all children in its React tree using the [React context API](https://reactjs.org/docs/context.html):

```tsx
import { ContractsProvider } from './neo-one';
import * as ReactDOM from 'react-dom';
import { App } from './App';

const app = (
  <ContractsProvider>
    <App />
  </ContractsProvider>
);
ReactDOM.render(app, document.getElementById('app'));
```

`ContractsProvider` by default uses the generated helper methods to create the required props, but you may customize this by passing in your own `Client`, `DeveloperClient`s and/or `LocalClient`s:

```tsx
import { ContractsProvider, createClient } from './neo-one';
import * as ReactDOM from 'react-dom';
import { App } from './App';

const client = createClient();
const app = (
  <ContractsProvider client={client}>
    <App />
  </ContractsProvider>
);
ReactDOM.render(app, document.getElementById('app'));
```

### WithContracts

Once you've included `ContractsProvider` in your application, you may use the `WithContracts` component anywhere in your application to access the NEO•ONE client APIs. `WithContracts` is is a [render props](https://reactjs.org/docs/render-props.html) component that passes the `client` and your smart contract APIs to its child function:

```tsx
<WithContracts>{({ token }) => <div onClick={() => token.withdraw.confirmed()}>Withdraw</div>}</WithContracts>
```

---

## FromStream

`@neo-one/react` contains one export, the `FromStream` component. `FromStream` is a [render props](https://reactjs.org/docs/render-props.html) component that subscribes to the `Observable` returned from invoking the `createStream` prop. It then passes the most recently emitted value to its children function:

```tsx
<WithContracts>
  {({ client }) => (
    <FromStream props={[client]} createStream={() => client.block$}>
      {(block) => <div>The current block index is: {block.index}</div>}
    </FromStream>
  )}
</WithContracts>
```

`FromStream` accepts one additional prop, `props`, which is a list of values that are used within the `createStream` function. Without `props`, `createStream` is called on every render of `FromStream` and the result is subscribed to. With `props`, a new stream is subscribed to only when the value of one of the elements of `props` does not match the previous render. In general, you should go ahead and include any values you use in your `createStream` function within the `props` prop.
