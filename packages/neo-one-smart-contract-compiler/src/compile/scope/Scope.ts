import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export interface Name {
  readonly nameBrand: number;
}

export interface Scope {
  readonly add: (name: string) => Name;
  readonly addUnique: () => Name;
  readonly get: (sb: ScriptBuilder, node: ts.Node, options: VisitOptions, name: Name | string) => void;
  readonly getThis: (sb: ScriptBuilder, node: ts.Node, options: VisitOptions) => void;
  readonly getGlobal: (sb: ScriptBuilder, node: ts.Node, options: VisitOptions) => void;
  readonly set: (sb: ScriptBuilder, node: ts.Node, options: VisitOptions, name: Name | string) => void;
  readonly setThis: (sb: ScriptBuilder, node: ts.Node, options: VisitOptions) => void;
  readonly setGlobal: (sb: ScriptBuilder, node: ts.Node, options: VisitOptions) => void;
  readonly hasBinding: (name: string) => boolean;
  readonly pushAll: (sb: ScriptBuilder, node: ts.Node, options: VisitOptions) => void;
  readonly emit: (
    sb: ScriptBuilder,
    node: ts.Node,
    options: VisitOptions,
    func: (options: VisitOptions) => void,
  ) => void;
}
