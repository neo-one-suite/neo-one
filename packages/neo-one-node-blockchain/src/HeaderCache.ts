import { Header, HeaderCache as HeaderCacheNode } from '@neo-one/node-core';

export class HeaderCache implements HeaderCacheNode {
  private readonly mutableHeaders: Header[] = [];

  public get last() {
    if (this.mutableHeaders.length === 0) {
      return undefined;
    }

    return this.mutableHeaders[this.mutableHeaders.length - 1];
  }

  public get isFull() {
    return this.mutableHeaders.length >= 1000;
  }

  public add(header: Header) {
    this.mutableHeaders.push(header);
  }

  public tryRemoveFirst() {
    if (this.mutableHeaders.length === 0) {
      return undefined;
    }

    return this.mutableHeaders.shift();
  }

  public tryGet(idx: number) {
    if (this.mutableHeaders.length === 0) {
      return undefined;
    }
    const firstIndex = this.mutableHeaders[0].index;
    if (idx < firstIndex) {
      return undefined;
    }
    const newIdx = idx - firstIndex;
    if (newIdx >= this.mutableHeaders.length) {
      return undefined;
    }

    return this.mutableHeaders[idx];
  }
}
