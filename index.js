const fs = require('fs');
const child_process = require('child_process');
const {initCaches} = require('./cache.js');
const {redisKey} = require('./config.json');

let redisConfTxt = fs.readFileSync('./redis.conf.template', 'utf8');
redisConfTxt = redisConfTxt.replace(/# requirepass foobared/, `requirepass ${redisKey}`);
fs.writeFileSync('./redis.conf', redisConfTxt);

const cp = child_process.spawn('./redis-server', [
  './redis.conf',
]);
cp.on('error', err => {
  console.warn(err);
  process.exit(1);
});
cp.stdout.setEncoding('utf8');
cp.stdout.on('data', s => {
  console.log('got data', s);
  if (/Ready to accept connections/i.test(s)) {
    console.log('initializing caches');
    initCaches()
      .then(() => {
        console.log('caches initialized');
      }, err => {
        console.warn('failed to initialize caches', err);
      });
  }
});
cp.on('exit', code => {
  console.warn(`redis exited with code ${code}`);
  process.exit(code);
});