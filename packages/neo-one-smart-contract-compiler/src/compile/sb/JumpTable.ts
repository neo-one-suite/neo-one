import ts from 'typescript';

import { Bytecode, ScriptBuilder } from '../sb';

interface JumpResult {
  readonly node: ts.Node;
  readonly jumpNumber: number;
  readonly bytecode: Bytecode;
}

export class JumpTable {
  private mutableJumpNumber = 0;
  private readonly mutableTable: JumpResult[] = [];

  public add(sb: ScriptBuilder, node: ts.Node, body: () => void): number {
    const jumpNumber = this.mutableJumpNumber;
    this.mutableJumpNumber += 1;
    const { bytecode } = sb.capture(() => {
      body();
    });
    this.mutableTable.push({ jumpNumber, node, bytecode });

    return jumpNumber;
  }

  public emitTable(sb: ScriptBuilder, outerNode: ts.Node): void {
    this.mutableTable.forEach(({ node, jumpNumber, bytecode }) => {
      sb.emitHelper(
        node,
        {},
        sb.helpers.if({
          condition: () => {
            sb.emitOp(node, 'DUP');
            sb.emitPushInt(node, jumpNumber);
            sb.emitOp(node, 'NUMEQUAL');
          },
          whenTrue: () => {
            sb.emitOp(node, 'DROP');
            sb.emitBytecode(bytecode);
          },
        }),
      );
    });

    sb.emitOp(outerNode, 'ABORT');
  }
}
