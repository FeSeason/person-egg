'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/source/pt.js', controller.source.cookie);
  router.post('/upload', controller.home.upload);
  router.post('/submit', controller.home.matchExcel);
};
