const fs = require('fs');
const url = require('url');
const http = require('http');
const https = require('https');
const child_process = require('child_process');
const express = require('express');
const {initCaches} = require('./cache.js');
const {getAllWithdrawsDeposits} = require('./tokens.js');
const {redisKey} = require('./config.json');

const fullchainPath = './certs/fullchain.pem';
const privkeyPath = './certs/privkey.pem';

const httpPort = process.env.HTTP_PORT || 4444;
const httpsPort = process.env.HTTPS_PORT || 4445;

// console.log("HTTP Port is", httpPort);
// console.log("HTTPS Port is", httpsPort);

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
cp.stdout.on('data', async s => {
  try {
    // console.log('got data', s);
    if (/Ready to accept connections/i.test(s)) {
      console.log('initializing caches');
      await initCaches();
      console.log('caches initialized');
    }
  } catch (err) {
    console.warn('failed to initialize caches', err);
  }
});
cp.stderr.setEncoding('utf8');
cp.stderr.on('data', s => {
  console.warn(s);
});
cp.on('exit', code => {
  console.warn(`redis exited with code ${code}`);
  process.exit(code);
});
process.on('exit', () => {
  cp.kill();
});

let CERT = null;
let PRIVKEY = null;
try {
  CERT = fs.readFileSync(fullchainPath);
} catch (err) {
  console.warn(`failed to load ${fullchainPath}`);
}
try {
  PRIVKEY = fs.readFileSync(privkeyPath);
} catch (err) {
  console.warn(`failed to load ${privkeyPath}`);
}

const app = express();
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  next();
});
const appStatic = express.static(__dirname);
app.use(appStatic);
app.get('*', async (req, res, next) => {
  const o = url.parse(req.protocol + '://' + (req.headers['host'] || '') + req.url);
  // do not use this API in production or you will be fired
  if (o.hostname === 'stuck-debug.webaverse.com') {
    const {pathname} = o;
    const match = pathname.match(/^\/([^\/]+)\/([^\/]+)$/);
    console.log('match', pathname, match);
    if (match) {
      const contractName = match[1];
      const chainName = match[2];
      try {
        const result = await getAllWithdrawsDeposits(contractName)(chainName);
        res.json(result);
      } catch (err) {
        res.statusCode = 500;
        res.end(err.stack);
      }
    } else {
      res.statusCode = 404;
      res.end();
    }
  } else {
    next();
  }
});
app.use(appStatic);

http.createServer(app)
  .listen(httpPort);
console.log('http://localhost:'+httpPort);
if (CERT && PRIVKEY) {
  https.createServer({
    cert: CERT,
    key: PRIVKEY,
  }, app)
    .listen(httpsPort);
  console.log('https://localhost:'+httpsPort);
}

const _warn = err => {
  console.warn('uncaught: ' + err.stack);
};
process.on('uncaughtException', _warn);
process.on('unhandledRejection', _warn);