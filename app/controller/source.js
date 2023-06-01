/* eslint-disable array-bracket-spacing */
/* eslint-disable array-callback-return */
'use strict';

const { Controller } = require('egg');
// const path = require('path');
// const fs = require('fs');

class SourceController extends Controller {

  async cookie() {
    const { ctx } = this;
    const expires = new Date();

    expires.setDate(expires.getDate() + 1); // 过期时间设置为 7 天后

    ctx.cookies.set('myCookie', 'HelloWorld', { domain: 'i.nianxiaonian.com', path: '/', expires, httpOnly: false });
    ctx.body = 'Cookie set successfully.';
  }
}

module.exports = SourceController;
