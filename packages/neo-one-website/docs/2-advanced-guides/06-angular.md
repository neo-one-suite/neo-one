---
slug: angular
title: Angular
---

NEO•ONE has first-class integration with Angular applications.

Integrating NEO•ONE with Angular is a breeze using the generated NEO•ONE client APIs.

---

[[toc]]

---

## Generated Code

The NEO•ONE toolchain emits an [Angular Service](https://angular.io/guide/dependency-injection#injecting-services) that aids in integrating an Angular application with NEO•ONE: `ContractsService`.

### ContractsService

The `ContractsService` can be injected into any component or service in which you need access to the client APIs or smart contract methods.

```typescript
import { Component } from '@angular/core';
import { ContractsService } from './neo-one';

@Component({
  selector: 'app-test-component',
  templateUrl: './test-component.component.html',
  styleUrls: ['./test-component.component.css'],
})
export class TestComponent implements OnInit {
  constructor(private contractsService: ContractsService) {}

  onWithdraw(): void {
    this.contractsService.token.withdraw
      .confirmed()
      .then
      // update something
      ();
  }
}
```

The `ContractsService` makes responding to updates in the blockchain easy by providing access to [Observables](https://angular.io/guide/observables-in-angular). Here's how you might use the `ContractsService` to build a simple Angular component to update the current block count.

```typescript
import { Component, OnInit } from '@angular/core';
import { ContractsService } from './neo-one';

@Component({
  selector: 'block-counter-component',
  templateUrl: './block-counter.component.html',
  styleUrls: ['./block-counter.component.css'],
})
export class BlockCounter implements OnInit {
  blockCount: number;

  constructor(private contractsService: ContractsService) {
    this.blockCount = 0;
  }

  ngOnInit() {
    this.getBlocks();
  }

  getBlocks(): void {
    this.contractsService.client.block$.subscribe((block) => {
      this.blockCount = block.block.index;
    });
  }
}
```

### Important Notes

- For the smoothest experience using NEO•ONE with Angular 6+, you should use the browserified version of NEO•ONE. This version of NEO•ONE replaces Node.js builtin modules with their browser compatible shims. To use this version, you simply need to import any NEO•ONE client modules with the `-browserify` suffix. So, `@neo-one/client` is imported as `@neo-one/client-browserify`.
- `allowSyntheticDefaultImports` must be set to `true` in the top level `tsconfig.json`.
- `(window as any).global = window;` must be added in the `polyfill.ts` file.
