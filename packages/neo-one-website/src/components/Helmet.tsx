// tslint:disable no-null-keyword
import React from 'react';
import { Head } from 'react-static';

interface Props {
  readonly title: string;
  readonly description?: string;
  readonly children?: React.ReactNode;
}

export const Helmet = ({ title, description, children, ...props }: Props) => (
  <Head
    title={title}
    {...props}
    meta={[
      { name: 'twitter:title', content: title },
      // @ts-ignore
      { itemprop: 'name', content: title },
      { property: 'og:title', content: title },
      // @ts-ignore
      { itemprop: 'image', content: 'https://neo-one.io/social.png' },
      { name: 'twitter:image:src', content: 'https://neo-one.io/social.png' },
      { property: 'og:image', content: 'https://neo-one.io/social.png' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:site', content: '@neo_one_suite' },
      { property: 'og:url', content: 'https://neo-one.io' },
      { property: 'og:site_name', content: 'NEO•ONE' },
      { property: 'og:type', content: 'website' },
    ].concat(
      description === undefined
        ? []
        : [
            { name: 'description', content: description },
            // @ts-ignore
            { itemprop: 'description', content: description },
            { property: 'og:description', content: description },
            { name: 'twitter:description', content: description },
          ],
    )}
  >
    {children}
  </Head>
);
