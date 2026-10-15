const { Command } = require('commander');

function show(a) {
  return a
    .map((x) => {
      if (x && typeof x.name === 'function' && x.constructor.name === 'Command') {
        return '<Command ' + x.name() + '>';
      }
      return JSON.stringify(x);
    })
    .join('  |  ');
}

function test(spec, argv) {
  const p = new Command();
  p.exitOverride();
  p.command(spec).action((...a) => {
    console.log('spec=' + JSON.stringify(spec) + '  argv=' + JSON.stringify(argv));
    console.log('   handler 收到的参数: ' + show(a));
  });
  try {
    p.parse(['node', 'x', ...argv]);
  } catch (e) {
    console.log('   throw: ' + e.message);
  }
  console.log('');
}

test('create ', ['create', 'my-first-demo']);
test('create <projectName>', ['create', 'my-first-demo']);
