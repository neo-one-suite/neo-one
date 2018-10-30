// tslint:disable no-any strict-boolean-expressions
import * as React from 'react';

export const pure: <T>(value: T) => T = (React as any).memo;
