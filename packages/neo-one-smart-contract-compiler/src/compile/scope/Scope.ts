import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

// tslint:disable-next-line
export interface Name {
  nameBrand: number;
}

export interface Scope {
  add(name: string): Name;
  addUnique(): Name;
  get(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    name: Name | string,
  ): void;
  getThis(sb: ScriptBuilder, node: Node, options: VisitOptions): void;
  getGlobal(sb: ScriptBuilder, node: Node, options: VisitOptions): void;
  set(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    name: Name | string,
  ): void;
  setThis(sb: ScriptBuilder, node: Node, options: VisitOptions): void;
  setGlobal(sb: ScriptBuilder, node: Node, options: VisitOptions): void;
  hasBinding(name: string): boolean;
  pushAll(sb: ScriptBuilder, node: Node, options: VisitOptions): void;
  emit(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    func: (options: VisitOptions) => void,
  ): void;
}
