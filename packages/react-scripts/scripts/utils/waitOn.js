const http = require('http');

const check = (options) => new Promise((resolve, reject) => {
  const req = http.get(`http://${options.host}:${options.port}`, (res) => {
    const statusCode = res.statusCode || 400;
    statusCode < 400 ? resolve() : reject(new Error(`${statusCode}`));
    res.resume();
  });
  req.on('error', reject);
});

const throttle = (delay) => new Promise((resolve, _) => setTimeout(resolve, delay));
const invertPromise = (promise) => promise.then(() => Promise.reject(null), (err) => Promise.resolve());

module.exports = (options, retries, delay) =>
  invertPromise(Array.from(Array(retries).keys()).reduce((promise) => promise
    .then(() => throttle(delay))
    .then(() => invertPromise(check(options))), invertPromise(check(options))));
