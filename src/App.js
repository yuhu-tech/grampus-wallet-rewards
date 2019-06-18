import React, { Component } from 'react'
import { gql } from './common/request'
import './App.css';

const err_message = {
  VERIFICATION_CODE_ERROR: 'verification code error',
  CREATE_USER_ERROR: 'create user error',
  SEND_MESSAGE_BY_ALI_ERROR: 'send message by ali error',
  VERIFICATION_IS_LOCKED: 'verification is locked',
  SEND_VERIFICATION_CODE_TOO_FREQUENCY: 'send verification code too frequency'
}

const err_notification = {
  VERIFICATION_CODE_ERROR: '验证码错误',
  CREATE_USER_ERROR: '创建用户失败',
  SEND_MESSAGE_BY_ALI_ERROR: '发送验证短信失败',
  VERIFICATION_IS_LOCKED: '验证错误次数过多，账户已锁定',
  SEND_VERIFICATION_CODE_TOO_FREQUENCY: '发送验证短信频率过高'
}

var browser = {
  versions: function () {
    var u = navigator.userAgent;
    return {//移动终端浏览器版本信息 
      trident: u.indexOf('Trident') > -1, //IE内核
      presto: u.indexOf('Presto') > -1, //opera内核
      webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
      gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') === -1, //火狐内核
      mobile: !!u.match(/AppleWebKit.*Mobile.*/) || !!u.match(/AppleWebKit/), //是否为移动终端
      ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
      android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器
      iPhone: u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, //是否为iPhone或者QQHD浏览器
      iPad: u.indexOf('iPad') > -1, //是否iPad
      webApp: u.indexOf('Safari') === -1 //是否web应该程序，没有头部与底部
    };
  }(),
  language: (navigator.browserLanguage || navigator.language).toLowerCase()
}


class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      phoneNumber: '',
      code: '',
      isGetCode: false,
      count: 60,
      scheme: '',
      download_url: 'http://assets.dusd.com/download-app',
      timeout: 2000,
      userid: ''
    }
  }

  componentDidMount() {
    if (/MicroMessenger/i.test(window.navigator.appVersion)) {
      // 微信
      alert('请点击右上角按钮，然后选择浏览器中打开')
      return;
    } 
    let scheme = `dusd://open?type=2&userid=${this.getUrlParam("userid")}`
    this.setState({
      scheme: scheme,
      userid: this.getUrlParam("userid")
    })
  }

  getUrlParam = (paraName) => {
    var url = document.location.toString();
    var arrObj = url.split("?");

    if (arrObj.length > 1) {
      var arrPara = arrObj[1].split("&");
      var arr;

      for (var i = 0; i < arrPara.length; i++) {
        arr = arrPara[i].split("=");

        if (arr != null && arr[0] === paraName) {
          return arr[1];
        }
      }
      return "";
    }
    else {
      return "";
    }
  }

  _openclient = () => {
    var self = this
    var loadDateTime = Date.now();
    window.location.href = self.state.scheme;

    var t = setTimeout(() => {
      var timeOutDateTime = new Date();
      if (!loadDateTime || timeOutDateTime - loadDateTime < 2010) {
        window.location.href = self.state.download_url;
      }
    }, self.state.timeout);

    window.onblur = function () {
      clearTimeout(t);
    }
  }

  _isOpen = () => {
    if (/MicroMessenger/i.test(window.navigator.appVersion)) {
      // 微信
      alert('请点击右上角按钮，然后选择浏览器中打开')
      return false;
    } else {
      if (browser.versions.ios || browser.versions.iPhone || browser.versions.iPad) {
        // ios
        this._openclient();
      } else if (browser.versions.android) {
        // android
        this._openclient();
      } else {
        // 其他
        window.location.href = this.state.download_url;
      }
    }
  }

  _startCount = () => {
    let counter = setInterval(() => {
      if (this.state.count === 0) {
        clearInterval(counter)
        this.setState({
          isGetCode: false
        })
        return
      }
      this.setState({
        count: this.state.count - 1
      })
    }, 1000)
  }

  _getCode = async () => {
    if (!this._checkPhoneNum(this.state.phoneNumber)) {
      alert('电话号码错误，请重试')
      return
    }
    const param = `
      mutation getCode($phoneNumber: String!) {
        sendVerificationCode(phoneNumber: $phoneNumber)
      }
    `
    const variables = {
      phoneNumber: this.state.phoneNumber
    }
    let res = await gql(param, variables)
    if (res) {
      this.setState({
        isGetCode: true
      })
      this._startCount()
    }
  }

  _checkPhoneNum = (phone) => {
    var re = /^1[34578]\d{9}$/
    if (re.test(phone)) {
      return true
    } else {
      return false
    }
  }

  _getCodeDom = () => (
    <div className="getCode">
      <div className="phoneNumber">手机号</div>
      <div className="phoneWrp">
        <input
          className="phoneInput"
          type="number"
          onChange={(v) => {
            this.setState({
              phoneNumber: v.target.value
            })
          }}
          placeholder="请输入11位手机号"
        />
        {
          !this.state.isGetCode
            ?
            <div
              className="codeBtn"
              onClick={() => {
                this._getCode()
              }}
            >获取验证码</div>
            :
            <div
              className="codeBtn"
              style={{ background: "#999" }}
              onClick={() => {
                this._getCode()
              }}
            >{this.state.count}s</div>
        }

      </div>
    </div>
  )

  _login = async () => {
    const param = `
      mutation login(
        $phoneNumber: String!
        $verificationCode:String!
        $inviteCode:String!
      ){
        signupOrLogin(
          phoneNumber:$phoneNumber
          verificationCode:$verificationCode
          inviteCode:$inviteCode
        ){
          token
          refreshToken
          expiredDate
        }
      }`
    const variables = {
      phoneNumber: this.state.phoneNumber,
      verificationCode: this.state.code,
      inviteCode: this.state.userid
    }
    let res = await gql(param, variables)
    if (res.errors) {
      let msg = ''
      switch (res.errors[0].message) {
        case err_message.VERIFICATION_CODE_ERROR:
          msg = err_notification.VERIFICATION_CODE_ERROR
          break
        case err_message.CREATE_USER_ERROR:
          msg = err_notification.CREATE_USER_ERROR
          break
        case err_message.SEND_MESSAGE_BY_ALI_ERROR:
          msg = err_notification.SEND_MESSAGE_BY_ALI_ERROR
          break
        case err_message.VERIFICATION_IS_LOCKED:
          msg = err_notification.VERIFICATION_IS_LOCKED
          break
        case err_message.SEND_VERIFICATION_CODE_TOO_FREQUENCY:
          msg = err_notification.SEND_VERIFICATION_CODE_TOO_FREQUENCY
          break
        default:
          msg = '登录失败'
          break
      }
      alert(msg)
      return
    }
    alert('注册成功')
    this._isOpen()
  }

  _codeDom = () => (
    <div className="getCode" style={{ marginBottom: 50 }}>
      <div className="phoneNumber">短信验证码</div>
      <div className="phoneWrp">
        <input
          className="phoneInput"
          type="number"
          placeholder="请输入4位验证码"
          onChange={(v) => {
            this.setState({
              code: v.target.value
            })
          }}
        />
      </div>
    </div>
  )

  _btnDom = () => (
    <div
      className="upBtn"
      onClick={() => {
        this._login()
      }}
    >注册</div>
  )

  render() {
    return (
      <div className="App">
        {this._getCodeDom()}
        {this._codeDom()}
        {this._btnDom()}
        {/* <div className="support">yuhu.tech</div> */}
      </div>
    );
  }
}

export default App;
