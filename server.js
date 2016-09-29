'use strict';

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const hostname = '127.0.0.1';
const port = 3000;

const argv = process.argv.splice(2);
let LAST_MODIFIED_ENABLE = false;
let ETAG_ENABLE = false;
let MAX_AGE = false;
let MAX_AGE_VALUE = 10;
if(argv && argv[0]){
  if(argv[0].indexOf('l') !== -1){
    console.log('开启last-modified');
    LAST_MODIFIED_ENABLE = true;
  }
  if(argv[0].indexOf('e') !== -1){
    console.log('开启etag');
    ETAG_ENABLE = true;
  }
  if(argv[0].indexOf('m') !== -1){
    console.log('开启max-age');
    MAX_AGE = true;
  }
}

const CONTENT_TYPE = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/x-javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.appcache': 'text/cache-manifest'
}

const server = http.createServer((req, res) => {
  if('GET' === req.method){
    let pathname = url.parse(req.url).pathname;
    console.log('pathname=>' + pathname);
    let realPath = path.join(__dirname, pathname);
    fs.stat(realPath, function(err, stats){
      if(err){
        res.statusCode = 404;
        res.end('404');
        return;
      }
      if(stats.isFile()){
        // 设置适当的content-type
        res.setHeader('content-type', CONTENT_TYPE[path.extname(pathname)] || 'text/plain');
        if(MAX_AGE){
          res.setHeader('cache-control', 'max-age=' + MAX_AGE_VALUE);
        }
        if(ETAG_ENABLE){
          let etag = md5(realPath);
          res.setHeader('etag', etag);
          res.setHeader('cache-control', 'no-cache');
          if(req.headers['if-none-match'] && req.headers['if-none-match'] === etag){
            console.log(path.basename(pathname) + ' etag相同 返回304');
            res.statusCode = 304;
            res.end();
            return;
          }

        }
        if(LAST_MODIFIED_ENABLE){
          res.setHeader('last-modified', stats.mtime.toGMTString());
          res.setHeader('cache-control', 'no-cache');
          if(req.headers['if-modified-since'] && req.headers['if-modified-since'] === stats.mtime.toGMTString()){
            console.log(path.basename(pathname) + ' last-modified时间相同 返回304');
            res.statusCode = 304;
            res.end();
            return;
          }
        }
        let rs = fs.createReadStream(realPath);
        rs.pipe(res);

      }else{
        res.statusCode = 404;
        res.end('404');
      }

    })
  }else{
    res.statusCode = 404;
    res.end('非GET请求')
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});



// 计算md5 同步方式
function md5(filename){
  let content = fs.readFileSync(filename);
  let md5 = crypto.createHash('md5');
  md5.update(content);
  return md5.digest('hex');
}
