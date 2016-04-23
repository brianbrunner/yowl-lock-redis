# yowl-lock-redis

Lock a user interaction via [redlock](https://github.com/mike-marcacci/node-redlock) so that you can make an async call or multiple sends in between messages without having the user mess up your bot with a new request.

## Install

```bash
$ npm install yowl-lock-redis --save
```

## Usage

```js
var lock = require('yowl-lock-redis'); 

bot.use(lock([{ host: 'localhost' }], {}, "Let me finish what I'm doing before asking me something else!");
```
