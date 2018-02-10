/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const translate = require('../../server/translate.js').translate;

class Help extends React.Component {
  render() {
    const supportLinks = [
      {
        content: (
          <translate>
            Find what you're looking for in our detailed documentation and
            guides.\n\n- Learn how to [get
            started](/docs/en/installation.html).
          </translate>
        ),
        title: <translate>Browse the docs</translate>,
      },
      {
        content: (
          <translate>
            Ask questions and find answers from other NEO•ONE users.\n\n-
            Join the
            [#support](https://discord.gg/S86PqDE)
            channel on the NEO•ONE Discord community.\n- Many members of the community use Stack Overflow. Read
            through [existing
            questions](https://stackoverflow.com/questions/tagged/neo-one) tagged
            with **neo-one** or [ask your
            own](https://stackoverflow.com/questions/ask)!
          </translate>
        ),
        title: <translate>Join the community</translate>,
      },
      {
        content:
        <translate>
          Find out what's new with NEO•ONE.\n\n- Follow
          [NEO•ONE](https://twitter.com/neo_one_suite) on Twitter.\n- Subscribe to the
          [NEO•ONE blog](/blog/).\n- Look at the
          [changelog](https://github.com/neo-one-suite/neo-one/blob/master/CHANGELOG.md).
        </translate>,
        title: <translate>Stay up to date</translate>,
      },
    ];

    return (
      <div className="docMainWrapper wrapper">
        <Container className="mainContainer documentContainer postContainer">
          <div className="post">
            <header className="postHeader">
              <h2>
                <translate>Need help?</translate>
              </h2>
            </header>
            <p>
              <translate desc="statement made to reader">
                NEO•ONE is developed by community members just like you. Contributors are often around and available for questions.
              </translate>
            </p>
            <GridBlock contents={supportLinks} layout="threeColumn" />
          </div>
        </Container>
      </div>
    );
  }
}

Help.defaultProps = {
  language: 'en',
};

module.exports = Help;
