import _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { OnResize, OnResizeOptions } from './types';

interface ResizePX {
  readonly type: 'px';
  readonly id: string;
  readonly width: number;
  readonly height: number;
}

interface ResizeMax {
  readonly type: 'max';
  readonly id: string;
}

export type ResizeOptions = ResizePX | ResizeMax;

const isPixelResize = (value: ResizeOptions): value is ResizePX => value.type === 'px';

const MINIMIZED_TOOLBAR_SIZE: ResizePX = { type: 'px', id: 'toolbar', width: 40, height: 40 };

export class ResizeHandler {
  public readonly maxWidth$: BehaviorSubject<number>;
  private mutableResizeTimeout: number | undefined;
  private mutableToolbarSize: ResizeOptions = MINIMIZED_TOOLBAR_SIZE;
  private mutableSize: ResizeOptions[] = [];

  public constructor(private mutableOnResize: OnResize, maxWidth: number) {
    this.maxWidth$ = new BehaviorSubject(maxWidth);
  }

  public readonly updateOnResize = (onResize: OnResize) => {
    this.mutableOnResize = onResize;
  };

  public readonly updateMaxWidth = (maxWidth: number) => {
    if (this.maxWidth$.getValue() !== maxWidth) {
      this.maxWidth$.next(maxWidth);
    }
  };

  public readonly maximizeToolbar = (options: ResizeOptions) => {
    this.mutableToolbarSize = options;
    this.resize();
  };

  public readonly minimizeToolbar = () => {
    this.mutableToolbarSize = MINIMIZED_TOOLBAR_SIZE;
    this.delayedResize();
  };

  public readonly maximize = (options: ResizeOptions) => {
    this.mutableSize = this.mutableSize.filter((size) => size.id !== options.id);
    this.mutableSize.push(options);
    this.resize();
  };

  public readonly minimize = (id: string) => {
    this.mutableSize = this.mutableSize.filter((size) => size.id !== id);
    this.delayedResize();
  };

  private readonly delayedResize = () => {
    this.clearResizeTimeout();
    this.mutableResizeTimeout = setTimeout(() => {
      this.mutableResizeTimeout = undefined;
      this.resize();
      // tslint:disable-next-line no-any
    }, 1000) as any;
  };

  private readonly resize = () => {
    this.clearResizeTimeout();
    this.mutableOnResize(this.getSize());
  };

  private readonly clearResizeTimeout = () => {
    if (this.mutableResizeTimeout !== undefined) {
      this.mutableResizeTimeout = undefined;
      clearTimeout(this.mutableResizeTimeout);
    }
  };

  private readonly getSize = (): OnResizeOptions => {
    const fullScreen = this.mutableSize.some((size) => size.type === 'max');
    if (fullScreen) {
      return { width: '100%', height: '100%' };
    }

    const pixelResize = [this.mutableToolbarSize, ...this.mutableSize].filter(isPixelResize);
    const maxWidth = _.maxBy(pixelResize, (value: ResizePX) => value.width);
    const maxHeight = _.maxBy(pixelResize, (value: ResizePX) => value.height);
    if (maxWidth === undefined || maxHeight === undefined) {
      throw new Error('Something went wrong');
    }

    return { width: `${maxWidth.width}px`, height: `${maxHeight.height}px` };
  };
}
