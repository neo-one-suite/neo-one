import { Loading } from '@neo-one/react-common';
import * as React from 'react';
import { CourseApp } from './CourseApp';
import { CourseRequirementError } from './CourseRequirementError';

interface State {
  readonly indexeddb: {
    readonly checking: boolean;
    readonly available: boolean;
  };
}

export class CourseEntry extends React.Component<{}, State> {
  public readonly state = {
    indexeddb: {
      checking: true,
      available: false,
    },
  };

  public componentDidMount(): void {
    Modernizr.on('indexeddb', (available) => {
      this.setState({ indexeddb: { checking: false, available } });
    });
  }

  public render() {
    const { indexeddb } = this.state;
    if (indexeddb.checking) {
      return <Loading />;
    }

    if (!indexeddb.available) {
      return (
        <CourseRequirementError message="NEO•ONE Courses require IndexedDB to function. Your current browser does not support IndexedDB." />
      );
    }

    if (!Modernizr.serviceworker) {
      return (
        <CourseRequirementError message="NEO•ONE Courses require Service Workers to function. Your current browser does not support Service Workers." />
      );
    }

    if (!Modernizr.messagechannel) {
      return (
        <CourseRequirementError message="NEO•ONE Courses require Message Channels to function. Your current browser does not support Message Channels." />
      );
    }

    if (!Modernizr.postmessage) {
      return (
        <CourseRequirementError message="NEO•ONE Courses require window.postMessage to function. Your current browser does not support window.postMessage." />
      );
    }

    if (!Modernizr.webworkers) {
      return (
        <CourseRequirementError message="NEO•ONE Courses require Web Workers to function. Your current browser does not support Web Workers." />
      );
    }

    return <CourseApp />;
  }
}
