/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');
const Container = CompLibrary.Container;

const translate = require('../../server/translate.js').translate;

const siteConfig = require(process.cwd() + '/siteConfig.js');

class Users extends React.Component {
  render() {
    const showcase = siteConfig.users.map((user, i) => {
      return (
        <a href={user.infoLink} key={i}>
          <img src={user.image} title={user.caption} />
        </a>
      );
    });

    return (
      <div className="mainContainer">
        <Container padding={['bottom']}>
          <div className="showcaseSection">
            <div className="prose">
              <h1><translate>Who's Using NEO•ONE?</translate></h1>
              <p><translate>NEO•ONE powers decentralized apps and NEO blockchain integrations for projects of all sizes.</translate></p>
            </div>
            <div className="logos">{showcase}</div>
            <div className="prose">
              <p><translate>Is your project using NEO•ONE?</translate></p>
              <a
                href={siteConfig.repoUrl + '/edit/master/website/siteConfig.js'}
                className="button">
                <translate>Add your project</translate>
              </a>
            </div>
          </div>
        </Container>
      </div>
    );
  }
}

module.exports = Users;
