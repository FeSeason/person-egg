/* eslint-disable array-bracket-spacing */
/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1674896857310_4161';

  // add your middleware config here
  config.middleware = [];

  config.view = {
    defaultViewEngine: 'nunjucks',
    mapping: {
      '.tpl': 'nunjucks',
    },
  };

  config.multipart = {
    mode: 'file',
    allowArrayField: true,
    fileSize: '5mb',
    fileExtensions: ['.xlsx'],
  };

  config.security = {
    csrf: {
      enable: false,
    },
  };

  // config.bodyParser = {
  //   jsonLimit: '5mb',
  //   formLimit: '5mb',
  // };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
