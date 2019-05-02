import ts from 'typescript';
import { Call, Jmp, Jump, Line } from '../pc';
import { KnownProgramCounter } from '../pc/KnownProgramCounter';
import { Bytecode, SingleBytecode, Tags } from './ScriptBuilder';

// const MAX_JUMP = 32767;
const MAX_JUMP = 32000;

abstract class CodePoint {
  public abstract readonly length: number;
  private mutablePC: number | undefined;
  private mutablePrev: CodePoint | undefined;
  private mutableNext: CodePoint | undefined;

  public constructor(public readonly node: ts.Node, public readonly tags: Tags) {}

  public get pc(): number {
    return this.resolvePC();
  }

  public get prev(): CodePoint | undefined {
    return this.mutablePrev;
  }

  public set prev(prev: CodePoint | undefined) {
    this.mutablePC = undefined;
    this.mutablePrev = prev;
  }

  public get next(): CodePoint | undefined {
    return this.mutableNext;
  }

  public set next(next: CodePoint | undefined) {
    this.mutableNext = next;
  }

  public resolveAllPCs(): void {
    // tslint:disable-next-line no-this-assignment
    let current: CodePoint | undefined = this;
    // tslint:disable-next-line no-loop-statement
    while (current !== undefined) {
      current.resolvePC(true);
      current = current.next;
    }
  }

  private resolvePC(force = false): number {
    if (force || this.mutablePC === undefined || (this.prev !== undefined && this.prev.mutablePC === undefined)) {
      this.mutablePC = this.prev === undefined ? 0 : this.prev.pc + this.prev.length;
    }

    return this.mutablePC;
  }
}

class JumpCodePoint extends CodePoint {
  public readonly length = 3;
  private mutableTarget: CodePoint | undefined;

  public constructor(node: ts.Node, tags: Tags, public readonly type: 'JMP' | 'JMPIF' | 'JMPIFNOT' | 'CALL') {
    super(node, tags);
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

class LineCodePoint extends CodePoint {
  public readonly length: number = 5;
}

class BufferCodePoint extends CodePoint {
  public readonly length: number;

  public constructor(node: ts.Node, tags: Tags, public readonly value: Buffer) {
    super(node, tags);
    this.length = value.length;
  }
}

class JumpStationCodePoint extends CodePoint {
  public readonly length: number;
  private mutableTarget: CodePoint | undefined;

  public constructor(node: ts.Node, hasForward: boolean, public readonly reverseTarget: CodePoint) {
    super(node, ['JumpStation']);
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
  const mutableSources: { [pc: number]: (JumpCodePoint | JumpStationCodePoint)[] } = {};
  const mutableCodePoints: { [pc: number]: CodePoint } = {};
  const [firstNode, firstTags, firstBytecode] = bytecode[0];
  if (!(firstBytecode instanceof Jump)) {
    throw new Error('Expected first bytecode to be a jump.');
  }
  const first = new JumpCodePoint(firstNode, firstTags, firstBytecode.op);
  const jumpTargetPC = firstBytecode.pc.getPC();
  mutableSources[jumpTargetPC] = [first];
  mutableCodePoints[0] = first;

  let pc = first.length;
  let mutablePrev: CodePoint = first;
  bytecode.slice(1).forEach(([node, tags, value]) => {
    let mutableCodePoint: CodePoint;
    if (value instanceof Jump) {
      const targetPC = value.pc.getPC();
      let mutableJumpCodePoint;
      // We must have created the CodePoint already
      if (targetPC < pc) {
        mutableJumpCodePoint = new JumpCodePoint(node, tags, value.op);
        mutableJumpCodePoint.target = mutableCodePoints[targetPC];
        // We will create it in the future, store for later
      } else {
        mutableJumpCodePoint = new JumpCodePoint(node, tags, value.op);
        if ((mutableSources[targetPC] as JumpCodePoint[] | undefined) === undefined) {
          mutableSources[targetPC] = [];
        }
        mutableSources[targetPC].push(mutableJumpCodePoint);
      }
      mutableCodePoint = mutableJumpCodePoint;
    } else if (value instanceof Line) {
      mutableCodePoint = new LineCodePoint(node, tags);
    } else {
      mutableCodePoint = new BufferCodePoint(node, tags, value);
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

const addJumpStations = (node: ts.Node, codePoint: CodePoint, maxOffset: number): void => {
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

      const mutablePrev = mutableCurrent.prev;
      if (mutablePrev !== undefined) {
        mutablePrev.next = mutableJumpStation;
      }
      mutableCurrent.prev = mutableJumpStation;
      mutableJumpStation.next = mutableCurrent;
      mutableJumpStation.prev = mutablePrev;
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
  const mutableOut: SingleBytecode[] = [];
  // tslint:disable-next-line no-loop-statement
  while (current !== undefined) {
    if (current instanceof JumpCodePoint) {
      const pc = getTargetPC(current, current.target);
      if (current.type === 'CALL') {
        mutableOut.push([current.node, current.tags, new Call(pc)]);
      } else {
        mutableOut.push([current.node, current.tags, new Jmp(current.type, pc)]);
      }
    } else if (current instanceof BufferCodePoint) {
      mutableOut.push([current.node, current.tags, current.value]);
    } else if (current instanceof JumpStationCodePoint) {
      const target = current.target;
      const reverseTarget = new Jmp('JMP', getTargetPC(current, current.reverseTarget));
      if (target === undefined) {
        mutableOut.push([
          current.node,
          current.tags,
          new Jmp('JMP', new KnownProgramCounter(current.pc + current.length)),
        ]);
        mutableOut.push([current.node, current.tags, reverseTarget]);
      } else {
        mutableOut.push([
          current.node,
          current.tags,
          new Jmp('JMP', new KnownProgramCounter(current.pc + current.length)),
        ]);
        mutableOut.push([current.node, current.tags, reverseTarget]);
        mutableOut.push([current.node, current.tags, new Jmp('JMP', getTargetPC(current, target))]);
      }
    } else if (current instanceof LineCodePoint) {
      mutableOut.push([current.node, current.tags, new Line()]);
    } else {
      throw new Error('Something went wrong.');
    }
    current = current.next;
  }

  return mutableOut;
};

export const resolveJumps = (bytecode: Bytecode, maxOffset: number = MAX_JUMP): Bytecode => {
  const length = bytecode.reduce<number>(
    (acc, value) => (value instanceof Jump ? acc + 3 : value instanceof Line ? acc + 5 : acc + value.length),
    0,
  );
  if (length < MAX_JUMP) {
    return bytecode;
  }

  const codePoint = getCodePoint(bytecode);
  addJumpStations(bytecode[0][0], codePoint, maxOffset);

  return getBytecode(codePoint);
};
