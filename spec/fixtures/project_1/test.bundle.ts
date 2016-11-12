
declare interface NodeRequire {
  context: any;
}

const ctx = require.context(__dirname + '/src', true, /\.ts$/);
ctx.keys().map(moduleName => ctx(moduleName));
