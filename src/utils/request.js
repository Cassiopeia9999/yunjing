import axios from 'axios' // 导入 axios
import { ElMessage, ElNotification, ElMessageBox as MessageBox } from 'element-plus' // 正确导入 Element Plus 的组件
import store from '@/store' // Vuex store 导入
import { getToken } from '@/utils/auth' // 自定义的身份认证工具
import errorCode from '@/utils/errorCode' // 错误码工具
import Cookies from 'js-cookie' // Cookie 管理库

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API + '/admin-api/', // 后端的基础路径
  timeout: 100000
})

// 判断是否是移动端
export function isMobile() {
  return /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
      .test(navigator.userAgent);
}

// 生成随机状态
export function generateRandomState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 微信授权跳转
export function startWeChatLogin() {
  const appId = import.meta.env.VITE_APP_WECHAT_APPID;
  const baseRedirectUri = import.meta.env.VITE_APP_REDIRECT_URI;

  if (!baseRedirectUri) {
    console.error("VUE_APP_REDIRECT_URI 未定义");
    return;
  }

  const redirectUri = encodeURIComponent(baseRedirectUri + "/social-login");
  const state = generateRandomState();
  localStorage.setItem('wechat_state', state); // 存储生成的 state
  localStorage.setItem('scope', "snsapi_base"); // 存储生成的 state

  const scope = 'snsapi_base';

  const weChatAuthUrl = "https://open.weixin.qq.com/connect/oauth2/authorize"
      + "?appid=" + appId
      + "&redirect_uri=" + redirectUri
      + "&response_type=code"
      + "&scope=" + scope
      + "&state=" + state
      + "#wechat_redirect";

  console.log("微信授权 URL:", weChatAuthUrl);

  // 跳转到微信授权页面
  window.location.href = weChatAuthUrl;
}

// 定义 API 白名单
const whiteList = [
  /^\/system/,
  /^\/notlogin\/allow/
];

// 请求拦截器
service.interceptors.request.use(config => {
  const isToken = (config.headers || {}).isToken === false;
  const token = getToken();

  if (!token && !isToken) {
    const isWhiteListed = whiteList.some(item => {
      if (typeof item === 'string' && config.url) {
        return config.url.includes(item);
      } else if (item instanceof RegExp && config.url) {
        return item.test(config.url);
      }
      return false;
    });

    if (!isWhiteListed) {
      if (isMobile()) {
        startWeChatLogin(); // 确保该方法内部无异常
      } else {
        const redirect = encodeURIComponent((window.location.pathname || '') + (window.location.search || ''));
        window.location.href = `/login?redirect=${redirect}`;
      }
      return Promise.resolve({
        status: 302,
        message: '未登录，已跳转到登录页面或微信授权页面',
        data: '未登录',
      });
    }
  } else {
    if (token && !isToken) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
  }

  const tenantId = Cookies.get('tenantId') || localStorage.getItem('tenantid');
  if (tenantId) {
    config.headers['tenant-id'] = tenantId;
  }

  // get 请求参数处理
  if (config.method === 'get' && config.params) {
    let url = config.url + '?';
    for (const propName of Object.keys(config.params)) {
      const value = config.params[propName];
      const part = encodeURIComponent(propName) + "=";
      if (value !== null && typeof value !== "undefined") {
        if (typeof value === 'object') {
          for (const key of Object.keys(value)) {
            let params = propName + '[' + key + ']';
            const subPart = encodeURIComponent(params) + "=";
            url += subPart + encodeURIComponent(value[key]) + "&";
          }
        } else {
          url += part + encodeURIComponent(value) + "&";
        }
      }
    }
    url = url.slice(0, -1);
    config.params = {};
    config.url = url;
  }

  return config;
}, error => {
  console.log(error);
  return Promise.reject(error);
});

// 响应拦截器
service.interceptors.response.use(res => {
  const code = res.data.code || 200;
  const msg = errorCode[code] || res.data.msg || errorCode['default'];
  if (code === 401) {
    MessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
      confirmButtonText: '重新登录',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      store.dispatch('LogOut').then(() => {
        location.href = '/index'
      })
    })
  } else if (code === 500) {
    ElMessage({
      message: msg,
      type: 'error'
    })
    return Promise.reject(new Error(msg))
  } else if (code === 901) {
    ElMessage({
      type: 'error',
      duration: 0,
      dangerouslyUseHTMLString: true,
      message: '<div>演示模式，无法进行写操作</div>' +
          '<div> &nbsp; </div>' +
          '<div>参考 https://alidocs.dingtalk.com/i/p/r98znlY19PD4RmLx 教程</div>' +
          '<div> &nbsp; </div>' +
          '<div>30 分钟搭建本地环境</div>',
    })
    return Promise.reject(new Error(msg))
  } else if (code !== 200) {
    ElNotification.error({
      title: msg
    })
    return Promise.reject(msg)
  } else {
    return res.data
  }
}, error => {
  console.log('err' + error)
  let message = error && error.message ? error.message : "Unknown error occurred";
  if (message === "Network Error") {
    message = "后端接口连接异常"
  } else if (message.includes("timeout")) {
    message = "系统接口请求超时"
  } else if (message.includes("Request failed with status code")) {
    message = "系统接口" + message.substr(message.length - 3) + "异常"
  }
  ElMessage({
    message: message,
    type: 'error',
    duration: 5 * 1000
  })
  return Promise.reject(error)
})

export function getBaseHeader() {
  return {
    'Authorization': "Bearer " + getToken(),
    'tenant-id': Cookies.get('tenantId'),
  }
}

export default service;
