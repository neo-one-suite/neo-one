---
slug: vue
title: Vue
---

NEO•ONE has integration with Vue applications.

Integrating NEO•ONE with Vue is a breeze using the generated NEO•ONE client APIs.

---

[[toc]]

---

## Generated Code

The NEO•ONE toolchain emits a service that aids in integrating a Vue application with NEO•ONE: `contractsService`.

### ContractsService

The `contractsService` is a singleton which provides access to all of the generated NEO•ONE client APIs and smart contract methods.

```typescript
<template>
  <div class="withdraw-class">
    <button v-on:click="withdraw">Withdraw</button>
  </div>
</template>

<script lang="ts">
import { contractsService } from './neo-one';
import Vue from 'vue';

export default Vue.extend({
  name: 'TestComponent',

  methods: {
    withdraw: function() {
      contractsService.one.withdraw.confirmed().then(
        // update something
      )
    },
  },
});
</script>
```

The `contractsService` makes responding to updates in the blockchain easy by providing access to observables. Here's how you might use the `contractsService` to build a simple Vue component to update the current block count.

```typescript
<template>
  <div class="block-count-class">
    <h1>Block: {{count}}</h1>
  </div>
</template>

<script lang="ts">
import { contractsService } from './neo-one';
import Vue from 'vue';

export default Vue.extend({
  name: 'TestComponent',
  data: function() {
    return {
      count: 0,
    };
  },
  created: function() {
    contractsService.client.block$.subscribe((block) => {
      this.count = block.block.index;
    });
  },
});
</script>
```
