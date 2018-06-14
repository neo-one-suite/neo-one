// tslint:disable
import _ from 'lodash';

import { Call, Jmp, Jump } from '../pc';

import { KnownProgramCounter } from '../pc/KnownProgramCounter';

export type Bytecode = Array<Buffer | Jump>;

const MAX_JUMP = 32767;
const JUMP_OFFSET = 20000;

abstract class CodePoint {
  public abstract length: number;
  public readonly sources: Set<JumpCodePoint> = new Set();
  private pcInternal: number | undefined;
  private prevInternal: CodePoint | undefined;
  private nextInternal: CodePoint | undefined;

  public get pc(): number {
    return this.resolvePC();
  }

  public resolvePC(): number {
    if (this.pcInternal == undefined) {
      this.pcInternal = 0;
      if (this.prev == undefined) {
        this.pcInternal = 0;
      } else {
        this.pcInternal = this.prev.pc + this.prev.length;
      }
    }

    return this.pcInternal;
  }

  public resetPC(): void {
    if (this.pcInternal != undefined) {
      this.pcInternal = undefined;
      let next = this.next;
      while (next != undefined) {
        next.pcInternal = undefined;
        next = next.next;
      }
    }
  }

  public get totalLength(): number {
    let length = this.length;
    let next = this.next;
    while (next != undefined) {
      length += next.length;
      next = next.next;
    }
    return length;
  }

  public get prev(): CodePoint | undefined {
    return this.prevInternal;
  }

  public set prev(prev: CodePoint | undefined) {
    this.resetPC();
    this.prevInternal = prev;
  }

  public get next(): CodePoint | undefined {
    return this.nextInternal;
  }

  public set next(next: CodePoint | undefined) {
    this.nextInternal = next;
  }

  public insertJumps(targets: NewJump[]): CodePoint {
    let self: CodePoint | undefined = this;
    let skipJump = false;
    let ret: CodePoint = this;
    while (self != undefined) {
      const target = targets[0];
      if (target == undefined) {
        return ret;
      }

      let length = 0;
      if (self.next != undefined && !skipJump) {
        length = 3;
      }

      let next: CodePoint | undefined = self.next;
      let nextSkipJump = false;
      if (
        (target.isMax && self.pc + self.length + length > target.pc + target.getPostOffset()) ||
        (!target.isMax && self.pc >= target.pc + target.getPostOffset() - length)
      ) {
        next = self;
        if (skipJump) {
          const resolved = target.resolve();
          self.insertBefore(resolved);
          if (self === this) {
            ret = resolved;
          }
        } else {
          const resolved = target.resolve();
          const jump = new JumpCodePoint('JMP', self);
          self.insertBefore(jump);
          jump.insertAfter(resolved);
          if (self === this) {
            ret = resolved;
          }
        }
        nextSkipJump = true;
        targets.shift();
      }

      self = next;
      skipJump = nextSkipJump;
    }

    if (targets.length > 0) {
      throw new Error(`Failed to insert all targets. Something went wrong. Remaining: ${targets.length}`);
    }

    return ret;
  }

  public insertBefore(point: CodePoint): void {
    if (this.prev != undefined) {
      this.prev.next = point;
      point.prev = this.prev;
    }

    this.prev = point;
    point.next = this;
  }

  public insertAfter(point: CodePoint): void {
    if (this.next != undefined) {
      this.next.prev = point;
      point.next = this.next;
    }

    this.next = point;
    point.prev = this;
  }

  public replace(point: CodePoint): void {
    if (this.prev != undefined) {
      this.prev.next = point;
      point.prevInternal = this.prev;
    }

    if (this.next != undefined) {
      if (point.length === this.length) {
        this.next.prevInternal = point;
      } else {
        this.next.prev = point;
      }

      point.next = this.next;
    }
  }
}

class JumpCodePoint extends CodePoint {
  public length = 3;

  public constructor(
    public readonly type: 'JMP' | 'JMPIF' | 'JMPIFNOT' | 'CALL',
    private targetInternal?: CodePoint | NewJump,
  ) {
    super();
  }

  public get target(): CodePoint | NewJump {
    if (this.targetInternal == undefined) {
      throw new Error('Target not set');
    }

    return this.targetInternal;
  }

  public set target(target: CodePoint | NewJump) {
    this.targetInternal = target;
  }

  public get isForwardJump(): boolean {
    return this.target.pc > this.pc;
  }

  public get isReverseJump(): boolean {
    return this.target.pc < this.pc;
  }

  public get offset(): number {
    if (this.target.pc === this.pc) {
      throw new Error('Something went wrong. Found equal target pc and current pc.');
    }
    return this.target.pc - this.pc;
  }
}

class BufferCodePoint extends CodePoint {
  public readonly length: number;

  public constructor(public readonly value: Buffer) {
    super();
    this.length = value.length;
  }
}

class NewJump {
  public length = 3;
  private sourceInternal: JumpCodePoint | NewJump | undefined;
  private internalPostOffset: number | undefined;

  public constructor(public readonly pc: number, public readonly isMax: boolean, public target: CodePoint | NewJump) {}

  public get source(): JumpCodePoint | NewJump {
    if (this.sourceInternal == undefined) {
      throw new Error('NewJump source is not set');
    }

    return this.sourceInternal;
  }

  public set source(source: JumpCodePoint | NewJump) {
    this.sourceInternal = source;
  }

  public resolve(): JumpCodePoint {
    const jump = new JumpCodePoint('JMP', this.target);
    this.source.target = jump;
    if (this.target instanceof NewJump) {
      this.target.source = jump;
    } else {
      this.target.sources.add(jump);
    }

    if (this.source instanceof JumpCodePoint) {
      jump.sources.add(this.source);
    }

    return jump;
  }

  public get isForwardJump(): boolean {
    return this.isMax;
  }

  public get isReverseJump(): boolean {
    return !this.isMax;
  }

  public get offset(): number {
    if (this.target.pc === this.pc) {
      throw new Error('Something went wrong. Found equal target pc and current pc.');
    }
    return this.target.pc - this.pc;
  }

  public getPostOffset(): number {
    if (this.internalPostOffset == undefined) {
      throw new Error('Not resolved');
    }

    return this.internalPostOffset;
  }

  public resolvePostOffset(targets: NewJump[]): void {
    const sourcePC = this.source.pc;
    if (this.isMax) {
      this.internalPostOffset = targets
        .filter((target) => sourcePC < target.pc && target.pc < this.pc)
        .reduce((acc) => acc - 6, 0);
    } else {
      this.internalPostOffset = targets
        .filter((target) => this.pc < target.pc && target.pc < sourcePC)
        .reduce((acc) => acc + 6, 0);
    }
  }
}

export class JumpResolver {
  public process(bytecode: Array<Buffer | Jump>): Array<Buffer | Jump> {
    let first: CodePoint = this.getCodePoint(bytecode);
    let newTargets = [];
    do {
      this.resolvePC(first);
      const result = this.processOne(first);
      first = result[0];
      newTargets = result[1];
      const sortedNewTargets = _.sortBy(newTargets, (target) => target.pc);
      sortedNewTargets.forEach((target) => target.resolvePostOffset(sortedNewTargets));
      first = first.insertJumps(sortedNewTargets);
    } while (newTargets.length > 0);

    this.resolvePC(first);
    let current: CodePoint | undefined = first;
    const out: Array<Buffer | Jump> = [];
    while (current != undefined) {
      if (current instanceof JumpCodePoint) {
        const pc = new KnownProgramCounter(current.target.pc);
        if (current.type === 'CALL') {
          out.push(new Call(pc));
        } else {
          out.push(new Jmp(current.type, pc));
        }
      } else if (current instanceof BufferCodePoint) {
        out.push(current.value);
      } else {
        throw new Error('Something went wrong.');
      }
      current = current.next;
    }

    return out;
  }

  private processOne(codePoint: CodePoint): [CodePoint, NewJump[]] {
    const newTargets = [];

    let ret: CodePoint = codePoint;
    let value: CodePoint | undefined = codePoint;
    while (value != undefined) {
      if (value instanceof JumpCodePoint) {
        const result = this.getTarget(value);
        if (result == undefined) {
          value = value.next;
        } else {
          const [newValue, newValueTargets] = result;
          value.replace(newValue);
          if (value === codePoint) {
            ret = newValue;
          }
          newTargets.push(...newValueTargets);
          value = newValue.next;
        }
      } else {
        value = value.next;
      }
    }

    return [ret, newTargets];
  }

  private getTarget(value: JumpCodePoint): [JumpCodePoint, NewJump[]] | undefined {
    if ((value.isForwardJump && value.offset > MAX_JUMP) || (value.isReverseJump && value.offset < -MAX_JUMP)) {
      const isMax = value.isForwardJump;
      const newOffset = isMax ? JUMP_OFFSET : -JUMP_OFFSET;
      if (value.target instanceof NewJump) {
        throw new Error('Something went wrong. Unexpected jump target.');
      }
      const newValueTargets = this.getNewTarget(new NewJump(value.pc + newOffset, isMax, value.target));
      const newValueTarget = newValueTargets[0];
      const newValue: JumpCodePoint = new JumpCodePoint(value.type, newValueTarget);
      newValueTarget.source = newValue;
      value.target.sources.delete(value);
      [...value.sources].forEach((source) => {
        source.target = newValue;
        newValue.sources.add(source);
      });

      return [newValue, newValueTargets];
    }

    return undefined;
  }

  private getNewTarget(value: NewJump): NewJump[] {
    if ((value.isForwardJump && value.offset > MAX_JUMP) || (value.isReverseJump && value.offset < -MAX_JUMP)) {
      const isMax = value.isForwardJump;
      const newOffset = isMax ? JUMP_OFFSET : -JUMP_OFFSET;
      if (value.target instanceof NewJump) {
        throw new Error('Something went wrong. Unexpected jump target.');
      }
      const newValueTarget = new NewJump(value.pc + newOffset, isMax, value.target);
      value.target = newValueTarget;
      newValueTarget.source = value;
      const newTargets = this.getNewTarget(newValueTarget);
      return [value].concat(newTargets);
    }

    return [value];
  }

  private getCodePoint(bytecode: Array<Buffer | Jump>): CodePoint {
    const sources: { [pc: number]: JumpCodePoint[] } = {};
    const codePoints: { [pc: number]: CodePoint } = {};
    const firstBytecode = bytecode[0];
    let first: CodePoint;
    if (firstBytecode instanceof Jump) {
      const jumpCodePoint = new JumpCodePoint(firstBytecode.op);
      sources[firstBytecode.pc.getPC()] = [jumpCodePoint];
      first = jumpCodePoint;
    } else {
      first = new BufferCodePoint(firstBytecode);
    }
    codePoints[0] = first;

    let pc = first.length;
    let prev: CodePoint = first;
    for (const value of bytecode.slice(1)) {
      let codePoint: CodePoint;
      if (value instanceof Jump) {
        const targetPC = value.pc.getPC();
        let jumpCodePoint;
        if (targetPC < pc) {
          jumpCodePoint = new JumpCodePoint(value.op, codePoints[targetPC]);
          codePoints[targetPC].sources.add(jumpCodePoint);
        } else {
          jumpCodePoint = new JumpCodePoint(value.op);
          if (sources[targetPC] == undefined) {
            sources[targetPC] = [];
          }
          sources[targetPC].push(jumpCodePoint);
        }
        codePoint = jumpCodePoint;
      } else {
        codePoint = new BufferCodePoint(value);
      }

      const pcSources = sources[pc];
      if (pcSources != undefined) {
        delete sources[pc];
        pcSources.forEach((source) => {
          source.target = codePoint;
          codePoint.sources.add(source);
        });
      }
      codePoints[pc] = codePoint;
      pc += codePoint.length;

      codePoint.prev = prev;
      prev.next = codePoint;
      prev = codePoint;
    }

    return first;
  }

  private resolvePC(codePoint: CodePoint): void {
    codePoint.resetPC();
    let current: CodePoint | undefined = codePoint;
    while (current != undefined) {
      current.resolvePC();
      current = current.next;
    }
  }
}
