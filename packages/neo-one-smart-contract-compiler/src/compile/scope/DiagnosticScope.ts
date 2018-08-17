import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { Name, Scope } from './Scope';

const BRANDED_NAME = {
  nameBrand: 0,
};

export class DiagnosticScope implements Scope {
  public add(): Name {
    return BRANDED_NAME;
  }

  public addUnique(): Name {
    return BRANDED_NAME;
  }

  public set(): void {
    // do nothing
  }

  public get(): void {
    // do nothing
  }

  public getThis(): void {
    // do nothing
  }

  public getGlobal(): void {
    // do nothing
  }

  public setGlobal(): void {
    // do nothing
  }

  public pushAll(): void {
    // do nothing
  }

  public emit(_sb: ScriptBuilder, _node: ts.Node, options: VisitOptions, func: (options: VisitOptions) => void): void {
    func(options);
  }
}
