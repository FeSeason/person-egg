<html>
  <head>
    <title>考勤数据处理</title>
    <link rel="stylesheet" href="https://unpkg.com/element-ui/lib/theme-chalk/index.css">
    <script src="https://unpkg.com/vue@2/dist/vue.js"></script>
    <script src="https://unpkg.com/element-ui/lib/index.js"></script>

    <style>
      * {
        margin: 0;
        padding: 0;
      }
      #app {
        overflow: hidden;
      }
      body {
        background: url("https://images.pexels.com/photos/1038935/pexels-photo-1038935.jpeg?auto=compress&cs=tinysrgb&w=2048&h=1080&dpr=1") center no-repeat;
        background-size: cover;
      }
      .upload-body {
        width: 700px;
        margin: 120px auto;

      }
      .upload-area {
        display: flex;
        justify-content: space-between;
      }
      .el-icon-document {
        height: auto !important;
      }
      .el-upload-list .el-upload-list__item-status-label {
        top: 5px;
      }
      .red {}
      .submit {
        margin-top: 60px;
      }
      .el-icon-close {
        display: none !important;
      }
    </style>

  </head>
  <body>
    <div id="app">
      <div class="upload-body">
        <div class="upload-area">
          <el-upload class="upload-item" action="./upload" :multiple="false" accept=".xlsx" :on-change="dingTalkChange" :file-list="dingTalk">
            <el-button plain="plain">钉钉考勤数据</el-button>
            <div slot="tip" class="el-upload__tip red">只能上传xlsx格式文件</div>
          </el-upload>

          <el-upload class="upload-item" action="./upload" :multiple="false" accept=".xlsx" :on-change="weChatChange" :file-list="weChat">
            <el-button plain="plain">企微考勤数据</el-button>
            <div slot="tip" class="el-upload__tip red">只能上传xlsx格式文件</div>
          </el-upload>

          <div v-show="dingTalk.length > 0 && weChat.length > 0">
            <el-button @click="submit" :disabled="dingTalk.length === 0 || weChat.length === 0" type="primary" icon="el-icon-truck">生成异常表格</el-button>
          </div>
        </div>

      </div>
    </div>
  </body>

  <script>
    new Vue({
      el: '#app',
      data: function () {
        return {dingTalk: [], weChat: [], loading: false}
      },
      methods: {
        dingTalkChange(file, fileList) {
          this.dingTalk = fileList.slice(-1);
        },
        weChatChange(file, fileList) {
          this.weChat = fileList.slice(-1);
        },
        submit() {
          const loading = this.$loading({lock: true, text: '处理中请稍后...', spinner: 'el-icon-loading', background: 'rgba(0, 0, 0, 0.7)'});

          fetch('./submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              dingTalk: this
                .dingTalk[0]
                .response
                .data,
              weChat: this
                .weChat[0]
                .response
                .data
            })
          })
            .then(res => {
              loading.close();
              if (res.status === 200) {
                return res.blob()
              }
              this.$message({showClose: true, message: '接口返回异常', type: 'error'});
            })
            .then(res => {
              // 对blob对象进行处理
              const a = document.createElement('a');
              const body = document.querySelector('body');
              // 这里注意添加需要下载的文件后缀；
              a.download = `${new Date()
                .toLocaleString('chinese', {
                  hour12: false,
                  dateStyle: 'full'})}.xlsx`;
                  a.href = window
                    .URL
                    .createObjectURL(res);
                  a.style.display = 'none';
                  body.appendChild(a);
                  a.click();
                  body.removeChild(a);
                  window
                    .URL
                    .revokeObjectURL(a.href);

                  this.$message({showClose: true, message: '异常数据对比已完成。', type: 'success'});
                })
                .catch((err) => {
                  console.log('提交数据异常:', err)
                  loading.close();
                })
              }}
      })
  </script>
</html>