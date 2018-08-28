const chalk = require("chalk");
const http = require("http");
const spawn = require("child_process").spawn;
const path = require("path");
const fs = require("fs");

const throttle = delay =>
  new Promise((resolve, _) => setTimeout(resolve, delay));
const invertPromise = promise =>
  promise.then(() => Promise.reject(null), err => Promise.resolve());

const check = options =>
  new Promise((resolve, reject) => {
    const req = http.get(`http://${options.host}:${options.port}`, res => {
      const statusCode = res.statusCode || 400;
      statusCode < 400 ? resolve() : reject(new Error(`${statusCode}`));
      res.resume();
    });
    req.on("error", reject);
  });

const waitOn = (options, retries, delay) =>
  invertPromise(
    Array.from(Array(retries).keys()).reduce(
      promise =>
        promise
          .then(() => throttle(delay))
          .then(() => invertPromise(check(options))),
      invertPromise(check(options))
    )
  );

const modifiyPackageJson = appPackage => {
  appPackage.homepage = "./";
  appPackage.main = "./electron/index.js";
  appPackage.scripts = Object.assign(appPackage.scripts, {
    package: "electron-builder --config electron-builder.json --dir",
    release: "electron-builder --config electron-builder.json"
  });
  appPackage.devDependencies = Object.assign(
    appPackage.devDependencies || {},
    appPackage.dependencies
  );
  appPackage.dependencies = {};
};

const startElectron = port => {
  const reqOptions = {
    host: "localhost",
    method: "GET",
    port
  };

  const electronBinPath = "./node_modules/.bin/electron";
  const args = [
    "--inspect",
    "-r",
    "ts-node/register",
    "./src/electron/index.ts"
  ];
  const env = Object.assign({}, process.env, {
    TS_NODE_PROJECT: "tsconfig.electron.json"
  });

  return waitOn(reqOptions, 10, 1000).then(() => {
    const electron = spawn(electronBinPath, args, { env, stdio: "inherit" });
    console.log("Electron startet in development mode with --inspect.");
    electron.on("error", console.log);

    return electron;
  });
};

const electronBuild = (pkg, debug) => {
  const proc = spawn(
    '"./node_modules/.bin/tsc"',
    ["-p", "tsconfig.electron.json"],
    {
      stdio: "inherit",
      shell: true
    }
  );

  proc.once("exit", exit => {
    if (exit !== 0) {
      console.log(chalk.red("Error while compiling electron sources.\n"));
      return;
    }
    console.log(chalk.green("Electron sources compiled successfully.\n"));
    const electronPkg = {
      author: pkg.author,
      name: pkg.name,
      main: pkg.main,
      version: pkg.version,
      description: pkg.description,
      dependencies: pkg.dependencies,
    };

    fs.writeFileSync(
      path.resolve(process.cwd(), "build", "package.json"),
      JSON.stringify(electronPkg, null, 2)
    );
  });
};

module.exports = {
  electronBuild,
  modifiyPackageJson,
  startElectron,
  waitOn
};
