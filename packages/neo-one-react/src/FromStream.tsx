import * as React from 'react';
import { Observable, Subscription } from 'rxjs';

// tslint:disable-next-line no-null-keyword
const initialValue = Symbol.for('initialValue');

interface Props<T> {
  /* Stream of props to render */
  readonly props$: Observable<T>;
  /* Render function */
  readonly children: (props: T) => React.ReactNode;
}
interface State<T> {
  readonly value: T | typeof initialValue;
}
/**
 * Renders a stream of `Observable` data.
 *
 * The `props$` `Observable` is immediately subscribed on mount so the first render will include any data the observable immediately resolves with. This can be used to render a loading state in combination with `concat` and `of`. See example below.
 *
 * @example
 * import { concat, defer, of as _of } from 'rxjs';
 *
 * <FromStream
 *  props$={concat(
 *    _of(undefined),
 *    defer(async () => loadData()),
 *  )}
 * >
 *  {(data) => data === undefined
 *    ? <Loading />
 *    : <Component data={data} />}
 * </FromStream>
 */
export class FromStream<T> extends React.Component<Props<T>, State<T>> {
  // tslint:disable-next-line readonly-keyword
  public state: State<T>;
  private mutableSubscription: Subscription | undefined;
  private mutableMounted = false;

  public constructor(props: Props<T>) {
    super(props);

    this.state = {
      value: initialValue,
    };
    this.subscribe();
    this.mutableMounted = true;
  }

  public componentWillUnmount(): void {
    this.mutableMounted = false;
    this.unsubscribe();
  }

  public componentDidUpdate(prevProps: Props<T>): void {
    if (this.props.props$ !== prevProps.props$) {
      this.subscribe();
    }
  }

  public render(): React.ReactNode {
    const { value } = this.state;
    if (value === initialValue) {
      // tslint:disable-next-line no-null-keyword
      return null;
    }

    return this.props.children(value);
  }

  private subscribe(): void {
    this.unsubscribe();
    let stateSet = false;
    this.mutableSubscription = this.props.props$.subscribe({
      next: (value) => {
        stateSet = true;
        this._setValue(value);
      },
    });

    if (!stateSet) {
      this._setValue(initialValue);
    }
  }

  private _setValue(value: T | typeof initialValue): void {
    if (this.mutableMounted) {
      this.setState(() => ({ value }));
    } else {
      // tslint:disable-next-line no-object-mutation
      this.state = { value };
    }
  }

  private unsubscribe(): void {
    if (this.mutableSubscription !== undefined) {
      this.mutableSubscription.unsubscribe();
      this.mutableSubscription = undefined;
    }
  }
}
