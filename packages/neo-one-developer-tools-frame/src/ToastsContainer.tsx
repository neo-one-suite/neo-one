import * as React from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

export interface Toast {
  readonly id: string;
  readonly title: React.ReactNode;
  readonly message?: React.ReactNode;
  readonly autoHide?: number;
}

export type AddToast = (toast: Toast) => void;

export interface ToastsContextType {
  readonly toasts$: Observable<ReadonlyArray<Toast>>;
  readonly addToast: AddToast;
  readonly removeToast: (id: string) => void;
}

const toasts$ = new BehaviorSubject<ReadonlyArray<Toast>>([]);

// tslint:disable-next-line no-any
export const ToastsContext: any = React.createContext<ToastsContextType>({
  toasts$: toasts$.pipe(distinctUntilChanged()),
  addToast: (toast: Toast) => {
    const toasts = toasts$.getValue();
    const nextToasts = toasts.some((localToast) => localToast.id === toast.id) ? toasts : [...toasts, toast];
    toasts$.next(nextToasts);
  },
  removeToast: (id: string) => {
    toasts$.next(toasts$.getValue().filter((localToast) => localToast.id !== id));
  },
});

interface WithAddToastProps {
  readonly children: (addToast: AddToast) => React.ReactNode;
}

export function WithAddToast({ children }: WithAddToastProps) {
  return <ToastsContext.Consumer>{({ addToast }: ToastsContextType) => children(addToast)}</ToastsContext.Consumer>;
}
