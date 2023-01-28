/* eslint-disable array-bracket-spacing */
/* eslint-disable array-callback-return */
'use strict';

const { Controller } = require('egg');
const xlsx = require('node-xlsx');
// const path = require('path');
// const fs = require('fs');

class HomeController extends Controller {

  async index() {
    const { ctx } = this;

    await ctx.render('excel/index.tpl');
  }

  /**
   * 上传
   */
  async upload() {
    const { ctx } = this;
    const file = ctx.request.files[0];

    ctx.body = {
      code: 200,
      data: file.filepath,
    };
  }

  /**
   * 处理表格数据
   */
  async matchExcel() {
    const { ctx } = this;
    const { dingTalk, weChat } = ctx.request.body;

    if (!dingTalk || !weChat) {
      ctx.body = {
        code: 500,
        message: '文件上传异常',
      };
      return;
    }

    const dingTalkFile = dingTalk;
    const weChatFile = weChat;


    const dingTalkFileData = xlsx.parse(dingTalkFile)[0].data;
    const weChatFileData = xlsx.parse(weChatFile)[0].data;

    /** 钉钉用来获取请假类型索引 */
    const dingTalkHeaderRow = dingTalkFileData[3];
    /** 病假索引 */
    const dingTalkSickIndex = dingTalkHeaderRow.indexOf('病假(天)');
    /** 事假索引 */
    const dingTalkThingIndex = dingTalkHeaderRow.indexOf('事假(天)');
    /** 育儿假索引 */
    const dingTalkBabyIndex = dingTalkHeaderRow.indexOf('育儿假(天)');

    /** 处理钉钉JSON数据，key 为姓名 */
    const dingTalkParseData = {};

    for (let i = 4; i < dingTalkFileData.length; i++) {
      const rowData = dingTalkFileData[i];

      dingTalkParseData[dingTalkFileData[i][0]] = {
        sick: rowData[dingTalkSickIndex] ? Number(rowData[dingTalkSickIndex]) : 0,
        thing: rowData[dingTalkThingIndex] ? Number(rowData[dingTalkThingIndex]) : 0,
        baby: rowData[dingTalkBabyIndex] ? Number(rowData[dingTalkBabyIndex]) : 0,
        row: rowData,
      };
    }


    /** 企业微信获取请假类型索引 */
    const weChatHeaderRow = weChatFileData[0];
    /** 姓名索引 */
    const nameIndex = weChatHeaderRow.indexOf('姓名');
    /** 缺勤天数索引 */
    const absenceIndex = weChatHeaderRow.indexOf('缺勤天数');
    /** 缺勤类型索引 */
    const absenceTypeIndex = weChatHeaderRow.indexOf('缺勤类型');

    /** 处理企微JSON数据，key 为姓名 */
    const weChatParseData = {};

    for (let i = 1; i < weChatFileData.length; i++) {
      const rowData = weChatFileData[i];
      /** 请假类型 */
      const type = rowData[absenceTypeIndex];
      const absenceDays = rowData[absenceIndex] ? Number(rowData[absenceIndex]) : 0;
      const name = rowData[nameIndex];

      if (!weChatParseData[name]) {
        weChatParseData[name] = {
          sick: type === '病假' ? absenceDays : 0,
          thing: (type === '事假' || type === '年假') ? absenceDays : 0,
          baby: type === '育儿假' ? absenceDays : 0,
        };
      } else {
        switch (type) {
          case '病假':
            weChatParseData[name].sick += absenceDays;
            break;
          case '事假':
            weChatParseData[name].thing += absenceDays;
            break;
          case '年假':
            weChatParseData[name].thing += absenceDays;
            break;
          case '育儿假':
            weChatParseData[name].baby += absenceDays;
            break;
          default:
            break;
        }
      }
    }

    /** 匹配缺勤数据 */
    // 钉钉：病假=企业微信：病假
    // 钉钉：事假=企业微信：事假+年假
    // 钉钉：育儿假=企业微信：育儿假
    function MatchAbsence() {
      const res = [];
      /** 姓名对应请假类型日期, 先判断是否存在，存在则不添加 */
      const dingHasPushObj = {};
      // {
      //   '王俊英': {
      //     "病假 12-25 12-25 0.5天": 1,
      //   }
      // }

      const resolvePushByReg = (regStr, row, name) => {
        const reg = new RegExp(regStr);

        row.map(r => {

          if (reg.test(r)) {
            const splitArr = r.split('\n');

            splitArr.map(s => {
              // 排除干扰
              if (!reg.test(s)) return;

              const replaceStr = s.replace(/\d{2}:\d{2}到?\s?/g, '').replace(/[\u4E00-\u9FA5]{2,3}/g, str => str + ' ');

              if (!dingHasPushObj[name]) {
                dingHasPushObj[name] = {};
              }

              const [type, startDate, endDate, absenceDays] = replaceStr.split(' ');

              if (!dingHasPushObj[name][s]) {
                // 已经存在时间点，同一天请半天的情况需要累加时长,日期相同则叠加时长
                const exist = res.some((d, idx) => {
                  if (d[0] === name && d[1] === type && d[2] === startDate && d[3] === endDate) {
                    res[idx][4] += parseFloat(absenceDays) * 8;
                    return true;
                  }
                });

                // 不存在则push
                !exist && res.push([name, type, startDate, endDate, parseFloat(absenceDays) * 8]);

                if (!dingHasPushObj[name][s]) {
                  dingHasPushObj[name][s] = 1;
                }
              }
            });
          }

        });
      };


      Object.keys(dingTalkParseData).forEach(name => {
        const { sick, thing, baby, row } = dingTalkParseData[name];

        /** 没有请假 */
        if ((sick + thing + baby) === 0) {
          return;
        }

        const weChatItem = weChatParseData[name];

        /** 企微不存在则直接提取信息 */
        if (!weChatItem) {
          // 姓名，开始日期，结束日期，缺勤时间，请假类型
          resolvePushByReg('病假|事假|育儿假', row, name);
        } else {
          if (sick !== weChatItem.sick) {
            resolvePushByReg('病假', row, name, true);
          }
          if (thing !== weChatItem.thing) {
            resolvePushByReg('事假', row, name, true);
          }
          if (baby !== weChatItem.baby) {
            resolvePushByReg('育儿假', row, name, true);
          }
        }
      });

      return res;
    }


    const res = MatchAbsence();

    const sheetData = [
      ['姓名', '请假类型', '开始日期', '结束日期', '缺勤时间'],
      ...res,
    ];

    const excelBuffer = xlsx.build([{ name: '缺勤信息', data: sheetData }]); // Returns a buffer

    ctx.body = excelBuffer;

    // fs.writeFileSync(`./${new Date().toLocaleString('chinese', { hour12: false, dateStyle: 'full' })}.xlsx`, excelBuffer);

  }
}

module.exports = HomeController;
