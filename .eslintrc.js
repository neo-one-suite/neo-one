module.exports = {
  "parser": "babel-eslint",
  "extends": [
    "airbnb",
    "plugin:flowtype/recommended",
    "prettier",
    "prettier/flowtype"
  ],
  "plugins": [
    "flowtype"
  ],
  "env": {
    "browser": true,
    "es6": true,
    "node": true,
    "jest": true
  },
  "globals": {
    "Generator": true,
    "Browser": true,
    "Class": true,
    "FragmentComponent": true,
    "$Keys": true,
    "one": true
  },
  "rules": {
    "no-console": 2,
    "no-restricted-syntax": 0,
    "no-underscore-dangle": 0,
    "indent": 0,
    "indent-legacy": 0,
    "jsx-a11y/href-no-hash": 0,
    "class-methods-use-this": 0,
    "react/prefer-stateless-function": 0,
    "react/jsx-filename-extension": 0,
  },
};
