import { Node } from 'ts-simple-ast';

import { Call, Jmp, Jump } from '../pc';
import { KnownProgramCounter } from '../pc/KnownProgramCounter';

// const MAX_JUMP = 32767;
const MAX_JUMP = 32000;
type Bytecode = ReadonlyArray<[Node, Buffer | Jump]>;

abstract class CodePoint {
  public abstract readonly length: number;
  private mutablePC: number | undefined;
  private mutablePrev: CodePoint | undefined;
  private mutableNext: CodePoint | undefined;

  public constructor(public readonly node: Node) {}

  public get pc(): number {
    return this.resolvePC();
  }

  public get prev(): CodePoint | undefined {
    return this.mutablePrev;
  }

  public set prev(prev: CodePoint | undefined) {
    this.resetPC();
    this.mutablePrev = prev;
  }

  public get next(): CodePoint | undefined {
    return this.mutableNext;
  }

  public set next(next: CodePoint | undefined) {
    this.mutableNext = next;
  }

  public resolveAllPCs(): void {
    this.resetPC();

    // tslint:disable-next-line no-this-assignment
    let current: CodePoint | undefined = this;
    // tslint:disable-next-line no-loop-statement
    while (current !== undefined) {
      current.resolvePC();
      current = current.next;
    }
  }

  private resolvePC(): number {
    if (this.mutablePC === undefined) {
      this.mutablePC = this.prev === undefined ? 0 : this.prev.pc + this.prev.length;
    }

    return this.mutablePC;
  }

  private resetPC(): void {
    if (this.mutablePC !== undefined) {
      this.mutablePC = undefined;
      let mutableNext = this.next;

      // tslint:disable-next-line no-loop-statement
      while (mutableNext !== undefined) {
        mutableNext.mutablePC = undefined;
        mutableNext = mutableNext.next;
      }
    }
  }
}

class JumpCodePoint extends CodePoint {
  public readonly length = 3;
  private mutableTarget: CodePoint | undefined;

  public constructor(node: Node, public readonly type: 'JMP' | 'JMPIF' | 'JMPIFNOT' | 'CALL') {
    super(node);
  }

  public get target(): CodePoint {
    if (this.mutableTarget === undefined) {
      throw new Error('Target not set');
    }

    return this.mutableTarget;
  }

  public set target(target: CodePoint) {
    this.mutableTarget = target;
  }

  public get isForwardJump(): boolean {
    return this.target.pc > this.pc;
  }

  public get isReverseJump(): boolean {
    return this.target.pc < this.pc;
  }
}

class BufferCodePoint extends CodePoint {
  public readonly length: number;

  public constructor(node: Node, public readonly value: Buffer) {
    super(node);
    this.length = value.length;
  }
}

class JumpStationCodePoint extends CodePoint {
  public readonly length: number;
  private mutableTarget: CodePoint | undefined;

  public constructor(node: Node, hasForward: boolean, public readonly reverseTarget: CodePoint) {
    super(node);
    this.length = hasForward ? 9 : 6;
  }

  public get target(): CodePoint | undefined {
    return this.mutableTarget;
  }

  public set target(target: CodePoint | undefined) {
    this.mutableTarget = target;
  }
}

const getCodePoint = (bytecode: Bytecode): CodePoint => {
  const mutableSources: { [pc: number]: Array<JumpCodePoint | JumpStationCodePoint> } = {};
  const mutableCodePoints: { [pc: number]: CodePoint } = {};
  const [firstNode, firstBytecode] = bytecode[0];
  if (!(firstBytecode instanceof Jump)) {
    throw new Error('Expected first bytecode to be a jump.');
  }
  const first = new JumpCodePoint(firstNode, firstBytecode.op);
  const jumpTargetPC = firstBytecode.pc.getPC();
  mutableSources[jumpTargetPC] = [first];
  mutableCodePoints[0] = first;

  let pc = first.length;
  let mutablePrev: CodePoint = first;
  bytecode.slice(1).forEach(([node, value]) => {
    let mutableCodePoint: CodePoint;
    if (value instanceof Jump) {
      const targetPC = value.pc.getPC();
      let mutableJumpCodePoint;
      // We must have created the CodePoint already
      if (targetPC < pc) {
        mutableJumpCodePoint = new JumpCodePoint(node, value.op);
        mutableJumpCodePoint.target = mutableCodePoints[targetPC];
        // We will create it in the future, store for later
      } else {
        mutableJumpCodePoint = new JumpCodePoint(node, value.op);
        if ((mutableSources[targetPC] as JumpCodePoint[] | undefined) === undefined) {
          mutableSources[targetPC] = [];
        }
        mutableSources[targetPC].push(mutableJumpCodePoint);
      }
      mutableCodePoint = mutableJumpCodePoint;
    } else {
      mutableCodePoint = new BufferCodePoint(node, value);
    }

    // Find all sources that we created which target this code point and set their target
    const pcSources = mutableSources[pc] as JumpCodePoint[] | undefined;
    if (pcSources !== undefined) {
      pcSources.forEach((mutableSource) => {
        mutableSource.target = mutableCodePoint;
      });
    }
    mutableCodePoints[pc] = mutableCodePoint;
    pc += mutableCodePoint.length;

    mutableCodePoint.prev = mutablePrev;
    mutablePrev.next = mutableCodePoint;
    mutablePrev = mutableCodePoint;
  });

  return first;
};

const addJumpStations = (node: Node, codePoint: CodePoint, maxOffset: number): void => {
  codePoint.resolveAllPCs();

  const mutableFirstCodePoint = codePoint;
  if (!(mutableFirstCodePoint instanceof JumpCodePoint)) {
    throw new Error('Expected first codepoint to be a jump');
  }
  const secondCodePoint = codePoint.next;
  if (secondCodePoint === undefined) {
    throw new Error('Expected at least two codepoints');
  }

  let mutableReverseTarget = secondCodePoint;
  let forwardDone = false;
  let mutableCurrent: CodePoint | undefined = mutableFirstCodePoint;
  let firstJumpStation: JumpStationCodePoint | undefined;
  // tslint:disable-next-line no-loop-statement
  while (mutableCurrent !== undefined) {
    if (
      mutableCurrent instanceof JumpCodePoint &&
      mutableCurrent.isReverseJump &&
      mutableCurrent.pc - mutableCurrent.target.pc > maxOffset
    ) {
      mutableCurrent.target = mutableReverseTarget;
    }

    const reversePC = mutableReverseTarget.pc + (firstJumpStation === undefined ? 0 : 3);
    const mutableNext = mutableCurrent.next;
    if (mutableNext !== undefined && mutableNext.pc - reversePC + 9 > maxOffset) {
      const hasForward = !forwardDone && mutableFirstCodePoint.target.pc - maxOffset >= mutableNext.pc;
      let mutableJumpStation: JumpStationCodePoint;
      if (!hasForward && !forwardDone) {
        mutableJumpStation = new JumpStationCodePoint(node, true, mutableReverseTarget);
        mutableJumpStation.target = mutableFirstCodePoint.target;
        if (mutableReverseTarget instanceof JumpStationCodePoint) {
          mutableReverseTarget.target = mutableJumpStation;
        }
        forwardDone = true;
      } else {
        mutableJumpStation = new JumpStationCodePoint(node, hasForward, mutableReverseTarget);
        if (hasForward && mutableReverseTarget instanceof JumpStationCodePoint) {
          mutableReverseTarget.target = mutableJumpStation;
        }
      }

      if (firstJumpStation === undefined) {
        firstJumpStation = mutableJumpStation;
      }
      mutableReverseTarget = mutableJumpStation;

      mutableCurrent.next = mutableJumpStation;
      mutableJumpStation.next = mutableNext;
      mutableNext.prev = mutableJumpStation;
      mutableJumpStation.prev = mutableCurrent;

      codePoint.resolveAllPCs();
    }

    mutableCurrent = mutableCurrent.next;
  }

  if (firstJumpStation !== undefined) {
    mutableFirstCodePoint.target = firstJumpStation;
  }
};

const getTargetPC = (codePoint: CodePoint, target: CodePoint): KnownProgramCounter => {
  if (target instanceof JumpStationCodePoint) {
    if (target.pc > codePoint.pc) {
      return new KnownProgramCounter(target.pc + 6);
    }

    return new KnownProgramCounter(target.pc + 3);
  }

  return new KnownProgramCounter(target.pc);
};

const getBytecode = (first: CodePoint): Bytecode => {
  first.resolveAllPCs();

  let current: CodePoint | undefined = first;
  const mutableOut: Array<[Node, Buffer | Jump]> = [];
  // tslint:disable-next-line no-loop-statement
  while (current !== undefined) {
    if (current instanceof JumpCodePoint) {
      const pc = getTargetPC(current, current.target);
      if (current.type === 'CALL') {
        mutableOut.push([current.node, new Call(pc)]);
      } else {
        mutableOut.push([current.node, new Jmp(current.type, pc)]);
      }
    } else if (current instanceof BufferCodePoint) {
      mutableOut.push([current.node, current.value]);
    } else if (current instanceof JumpStationCodePoint) {
      const target = current.target;
      const reverseTarget = new Jmp('JMP', getTargetPC(current, current.reverseTarget));
      if (target === undefined) {
        mutableOut.push([current.node, new Jmp('JMP', new KnownProgramCounter(current.pc + current.length))]);
        mutableOut.push([current.node, reverseTarget]);
      } else {
        mutableOut.push([current.node, new Jmp('JMP', new KnownProgramCounter(current.pc + current.length))]);
        mutableOut.push([current.node, reverseTarget]);
        mutableOut.push([current.node, new Jmp('JMP', getTargetPC(current, target))]);
      }
    } else {
      throw new Error('Something went wrong.');
    }
    current = current.next;
  }

  return mutableOut;
};

export const resolveJumps = (bytecode: Bytecode, maxOffset: number = MAX_JUMP): Bytecode => {
  const codePoint = getCodePoint(bytecode);
  addJumpStations(bytecode[0][0], codePoint, maxOffset);

  return getBytecode(codePoint);
};
