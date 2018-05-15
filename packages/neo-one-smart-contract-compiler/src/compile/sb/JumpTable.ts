import { Node } from 'ts-simple-ast';

import { Bytecode, ScriptBuilder } from '../sb';

interface JumpResult {
  node: Node;
  jumpNumber: number;
  bytecode: Bytecode;
}

export class JumpTable {
  private jumpNumber: number = 0;
  private readonly table: JumpResult[] = [];

  public add(sb: ScriptBuilder, node: Node, body: () => void): number {
    const jumpNumber = this.jumpNumber;
    this.jumpNumber += 1;
    const { bytecode } = sb.capture(() => {
      body();
    });
    this.table.push({ jumpNumber, node, bytecode });

    return jumpNumber;
  }

  public emitTable(sb: ScriptBuilder, outerNode: Node): void {
    // TODO: Binary search over table - O(logn) ops vs O(n) currently
    this.table.forEach(({ node, jumpNumber, bytecode }) => {
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

    sb.emitOp(outerNode, 'THROW');
  }
}
