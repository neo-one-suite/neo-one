const execa = require('execa');

const cmd = async () =>
  await execa('node', ['-v']).then((val) => {
    const version = val.stdout.slice(1, 2).toString();
    switch (version) {
      case '8':
        return '--harmony_async_iteration';
      case '9':
        return '--harmony';
      default:
        return '';
    }
  });

result = cmd().then((val) => console.log(val));
