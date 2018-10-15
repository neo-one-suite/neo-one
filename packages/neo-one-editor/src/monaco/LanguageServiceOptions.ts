/// <reference types="monaco-editor/monaco" />
import { comlink } from '@neo-one/worker';
import ts from 'typescript';

import Emitter = monaco.Emitter;
import IEvent = monaco.IEvent;

export interface DiagnosticsOptions {
  readonly noSemanticValidation?: boolean;
  readonly noSyntaxValidation?: boolean;
}

export class LanguageServiceOptions {
  private readonly onDidChangeInternal = new Emitter<LanguageServiceOptions>();
  // tslint:disable-next-line readonly-keyword
  private mutableWorkerMaxIdleTime: number;
  private mutableEagerModelSync = false;
  private mutableCompilerOptions!: ts.CompilerOptions;
  private mutableDiagnosticOptions!: DiagnosticsOptions;
  private mutableIsSmartContract: boolean;
  private mutableID: string;
  private mutableEndpoint: () => comlink.Endpoint;

  public constructor(
    compilerOptions: ts.CompilerOptions,
    diagnosticsOptions: DiagnosticsOptions,
    id: string,
    endpoint: () => comlink.Endpoint,
    isSmartContract = false,
  ) {
    this.mutableWorkerMaxIdleTime = 2 * 60 * 1000;
    this.setCompilerOptions(compilerOptions);
    this.setDiagnosticsOptions(diagnosticsOptions);
    this.mutableID = id;
    this.mutableEndpoint = endpoint;
    this.mutableIsSmartContract = isSmartContract;
  }

  public get onDidChange(): IEvent<LanguageServiceOptions> {
    return this.onDidChangeInternal.event;
  }

  public getCompilerOptions(): ts.CompilerOptions {
    return this.mutableCompilerOptions;
  }

  public setCompilerOptions(options: ts.CompilerOptions = {}): void {
    this.mutableCompilerOptions = options;
    this.onDidChangeInternal.fire(this);
  }

  public getDiagnosticsOptions(): DiagnosticsOptions {
    return this.mutableDiagnosticOptions;
  }

  public setDiagnosticsOptions(options: DiagnosticsOptions = {}): void {
    this.mutableDiagnosticOptions = options;
    this.onDidChangeInternal.fire(this);
  }

  public setMaximumWorkerIdleTime(value: number): void {
    // doesn't fire an event since no worker restart is required here
    this.mutableWorkerMaxIdleTime = value;
  }

  public getWorkerMaxIdleTime() {
    return this.mutableWorkerMaxIdleTime;
  }

  public setEagerModelSync(value: boolean) {
    // doesn't fire an event since no
    // worker restart is required here
    this.mutableEagerModelSync = value;
  }

  public getEagerModelSync() {
    return this.mutableEagerModelSync;
  }

  public setIsSmartContract(isSmartContract: boolean) {
    this.mutableIsSmartContract = isSmartContract;
  }

  public isSmartContract() {
    return this.mutableIsSmartContract;
  }

  public setEndpointAndID(id: string, endpoint: () => comlink.Endpoint): void {
    if (this.mutableID !== id) {
      this.mutableID = id;
      this.mutableEndpoint = endpoint;
      this.onDidChangeInternal.fire(this);
    }
  }

  public getID(): string {
    return this.mutableID;
  }

  public getEndpoint(): comlink.Endpoint {
    return this.mutableEndpoint();
  }
}
