# cache-examples
examples for frontend cache

***

## 一 http缓存
先看正常请求的状态: 请运行 node server.js 然后打开 http://127.0.0.1:3000/demo1/index.html  
可以看到请求都是直接到服务器,然后服务器返回响应头的响应内容,此时没有启用缓存  

### 协商缓存304
#### last-modified
流程如下:
- 第一次请求如果响应头包含last-modified
- 第二次(及以后)相同请求查看是否有本地缓存,有则请求头带上if-modified-since,值为缓存下来的last=modified
- 服务端可根据if-modified-since值来判断是响应304(不带内容)还是200(带内容)

#### Etag
流程如下:
- 第一次请求如果响应头包含Etag
- 第二次(及以后)相同请求查看是否有本地缓存,有则请求头带上if-none-match,值为缓存下来的etag
- 服务端可根据if-none-match值来判断是响应304(不带内容)还是200(带内容)

Etag可以解决last-modified无法解决的一些问题:
- 静态资源周期性修改但内容不变
- 静态资源在短时间内频繁修改 last-modified时间粒度为s级
- 服务器无法精确获取文件修改时间  

所以服务端应当设计为Etag的优先级高于last-modified  
开启etag 运行 node server.js -e  
开启last-modified 运行 node server.js -l

### 过期缓存 from cache
协商缓存可以节省请求内容体的流量消耗,如果想直接减少请求,可使用过期缓存设置  
服务器响应头字段cache-control和expires用于过期设置

#### cache-control
cache-control 所有值对应的效果如下:
- public: 所有内容将被缓存(客户端和代理服务器都缓存)
- private: 内容只缓存到私有缓存中(客户端可以缓存,代理服务器不能缓存)
- no-cache: 使用协商缓存
- no-store: 不使用缓存
- must-revalidation/proxy-revalidation: 如果缓存失效,请求必须重新验证
- max-age=xxx: 缓存内容将在xxx秒之后失效(only http1.1)  

#### expires
expires表示在此时间前使用缓存(等同于max-age,同时存在被max-age覆盖)
开启max-age 运行 node server.js -m

### 结论
静态资源文件名使用哈希值命名情况下直接使用max-age开启长期强缓存
静态资源文件名未使用哈希值命名情况下使用协商缓存(也可搭配max-age开启短期强缓存)

## 二 cookie缓存
cookie是非常常见的缓存技术,一般用于存放用户session等
需要注意的是:
- 每次http请求都会带上当前域名下的所有cookie
- cookie有最大长度限制 (一般为4KB)

### 结论
静态资源放到与主域名不同的域名下以减少http请求的大小(因为不带cookie)  
谨慎使用cookie,最好只存放关键的用户信息

### 三 localStorage
localStorage是html5的缓存方案,最感人的是ie8也支持(T,T)
使用方法:  
``` js  

  // 增加/设置键值对
  localStorage.setItem('test', 'abc');
  // 获取
  localStorage.getItem('test');
  // 删除
  localStorage.removeItem('test');
  // 清空所有
  localStorage.clear();

```

### 注意
localStorage也有大小限制(一般为5MB,已经比cookie好很多了),一般用于存放后台返回的JSON数据

### 四 sessionStorage
sessionStorage与localStorage类似,api也相同,唯一的区别在于关闭浏览器(关闭标签页)后sessionStorage将清空

### 五 Application Cache
此特性虽然已经被WEB标准删除,但事实上很多浏览器已经支持此特性
#### 使用方法
html增加属性manifest 如
``` html

  <html manifest="./example.appcache">
  ...
  <link href="index.css" rel="stylesheet" />
  <script src="index.js"></script>
  ...

  </html>

```

manifest文件建议后缀名为.appcache  
后台需要设置媒体类型为text/cache-manifest  
示例内容为:
```

  CACHE MANIFEST
  #VERSION 1.1
  CACHE:
  index.css
  index.js


```

查看示例: 运行 node server.js 打开 http://127.0.0.1:3000/demo2/index.html  
第一次请求:浏览器正常加载页面,在页面资源加载成功下载manifest文件  
后续请求:浏览器只检查manifest文件是否更新,若更新则重新下载所有缓存文件,否则使用缓存
#### applicationCache api
``` js

  var appcache = window.applicationCache;
  // 查询manifest是否有更新
  appcache.update();

  //判断缓存是否已更新
  if(appcache.status === appcache.UPDATEREADY){
    // 缓存文件替换
    appcache.swapCache();
  }

```
#### 注意
浏览器检查到manifest文件有更新,重新下载文件是滞后处理(即当前还是使用旧的文件),第二次刷新页面才使用新的缓存



### 六 CacheStorage

### 七 Web Sql

### 八 indexDB

### 九 flash缓存
