const http = require('http');
const spawn = require('child_process').spawn;

const throttle = (delay) => new Promise((resolve, _) => setTimeout(resolve, delay));
const invertPromise = (promise) => promise.then(() => Promise.reject(null), (err) => Promise.resolve());

const check = (options) => new Promise((resolve, reject) => {
  const req = http.get(`http://${options.host}:${options.port}`, (res) => {
    const statusCode = res.statusCode || 400;
    statusCode < 400 ? resolve() : reject(new Error(`${statusCode}`));
    res.resume();
  });
  req.on('error', reject);
});

const waitOn = (options, retries, delay) =>
  invertPromise(Array.from(Array(retries).keys()).reduce((promise) => promise
    .then(() => throttle(delay))
    .then(() => invertPromise(check(options))), invertPromise(check(options))));


const electronAppPackage = (appPackage) => {
  appPackage.homepage = './';
};

const installElectronDependencies = (spawn, command, args) => {
  const deps = [
    'electron',
  ];

  console.log(`Installing ${deps.join(', ')} ${command}...`);
  console.log();

  const proc = spawn.sync(command, args.concat(deps), { stdio: 'inherit' });
  if (proc.status !== 0) {
    console.error(`\`${command} ${args.concat(deps).join(' ')}\` failed`);
    return;
  }
};

const startElectron = (port) => {
  const reqOptions = {
    host: 'localhost',
    method: 'GET',
    port,
  };

  const electronBinPath = './node_modules/.bin/electron';
  const args = ['--inspect', '-r', 'ts-node/register', './src/electron/index.ts'];
  const env = Object.assign({}, process.env, {
    TS_NODE_PROJECT: 'tsconfig.electron.json',
  });

  return waitOn(reqOptions, 10, 1000)
    .then(() => {
      const electron = spawn(electronBinPath, args, { env, stdio: 'inherit' });
      console.log('Electron startet in development mode with --inspect.')
      electron.on('error', console.log);

      return electron;
    });
}

module.exports = {
  electronAppPackage,
  installElectronDependencies,
  startElectron,
  waitOn,
};
