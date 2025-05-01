import {login, logout, socialLogin2, weChatSocialLogin} from '@/api/login'; // 导入登录相关的接口函数
import {getToken, setToken, removeToken, setTenantId, removeTenantId} from '@/utils/auth'; // 自定义的 token 管理工具
import Cookies from 'js-cookie'; // Cookie 管理库
import { setJwt } from '@/utils/auth'; // 用于设置 JWT 的工具

const user = {
  state: {
    token: getToken(),
    id: 0, // 用户编号
    name: '',
    avatar: '',
    roles: [],
    permissions: []
  },

  mutations: {
    SET_ID: (state, id) => {
      state.id = id;
    },
    SET_TOKEN: (state, token) => {
      state.token = token;
    },
    SET_NAME: (state, name) => {
      state.name = name;
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar;
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles;
    },
    SET_PERMISSIONS: (state, permissions) => {
      state.permissions = permissions;
    }
  },

  actions: {
    // 登录
    Login({ commit }, userInfo) {
      return new Promise((resolve, reject) => {
        // 判断是否为社交登录类型
        if (userInfo.type === 'social') {
          // 如果是社交登录，调用 socialLogin2 接口
          socialLogin2(userInfo).then(res => {
            res = res.data;
            setToken(res.token);  // 设置 token
            setJwt(res.jwt);  // 设置 JWT
            commit('SET_TOKEN', res.token);  // 提交 token 到 Vuex
            resolve();
          }).catch(error => {
            reject(error);
          });
        } else if(userInfo.type === 'username'){
          // 常规登录，调用 login 接口
          login(userInfo).then(res => {
            res = res.data;
            setToken(res.token);  // 设置 token
            setJwt(res.jwt);  // 设置 JWT
            commit('SET_TOKEN', res.token);  // 提交 token 到 Vuex
            localStorage.setItem('isLoggedIn', 'true');  // 设置登录状态

            // 如果有租户 ID，存储在 Cookies 中
            if (res.tenantId) {
              setTenantId(res.tenantId)
            }

            resolve();
          }).catch(error => {
            reject(error);
          });
        }
      });
    },

    // 微信公众号新登录逻辑
    weChatSocialLogin({ commit }, userInfo) {
      return new Promise((resolve, reject) => {
        weChatSocialLogin(userInfo).then(res => {
          const result = res.data;
          if (result.status === 'LOGIN_OK') {
            setToken(result.token);  // 设置 token
            commit('SET_TOKEN', result.token);  // 提交 token 到 Vuex
            if (res.tenantId) {
              setTenantId(res.tenantId)
            }
          }
          resolve(res);
        }).catch(error => {
          console.error("社交登录失败", error);
          reject(error);
        });
      });
    },

    // 获取用户信息
    GetInfo({ commit, state }) {
      return new Promise((resolve, reject) => {
        getInfo(state.token).then(res => {
          if (!res) {
            res = {
              data: {
                roles: [],
                user: {
                  id: '',
                  avatar: '',
                  userName: ''
                }
              }
            };
          }

          res = res.data;  // 读取 data 数据

          const user = res.user;
          const id = user.id;
          Cookies.set('id', id);
          const avatar = user.avatar === "" ? require("@/assets/images/profile.jpg") : user.avatar;
          if (res.roles && res.roles.length > 0) {  // 验证返回的 roles 是否是非空数组
            commit('SET_ROLES', res.roles);
            commit('SET_PERMISSIONS', res.permissions);
          } else {
            commit('SET_ROLES', ['ROLE_DEFAULT']);
          }
          commit('SET_ID', user.id);
          commit('SET_NAME', user.nickname);
          commit('SET_AVATAR', avatar);
          resolve(res);
        }).catch(error => {
          reject(error);
        });
      });
    },

    // 退出系统
    LogOut({ commit, state }) {
      return new Promise((resolve, reject) => {
        logout(state.token).then(() => {
          commit('SET_TOKEN', '');
          commit('SET_ROLES', []);
          commit('SET_PERMISSIONS', []);
          localStorage.removeItem('isLoggedIn');

          removeToken();  // 删除 token
          removeTenantId()
          resolve();
        }).catch(error => {
          reject(error);
        });
      });
    },

    // 前端登出
    FedLogOut({ commit }) {
      return new Promise(resolve => {
        commit('SET_TOKEN', '');
        removeToken();

        resolve();
      });
    }
  }
}

export default user;
