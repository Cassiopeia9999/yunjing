import {login, logout, getInfo, socialLogin, socialLogin2, weChatSocialLogin} from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import Cookies from 'js-cookie'
import { setJwt } from '../../utils/auth'

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
      state.id = id
    },
    SET_TOKEN: (state, token) => {
      state.token = token
    },
    SET_NAME: (state, name) => {
      state.name = name
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles
    },
    SET_PERMISSIONS: (state, permissions) => {
      state.permissions = permissions
    }
  },

  actions: {
    // 登录
    Login({commit}, userInfo) {
      // const username = userInfo.username.trim()
      // const username = userInfo.username.trim()
      // const password = userInfo.password
      // const code = userInfo.code
      // const uuid = userInfo.uuid
      return new Promise((resolve, reject) => {
        console.log(userInfo)
        if (userInfo.type) {
          socialLogin2(userInfo).then(res => {
            res = res.data;
            setToken(res.token)
            setJwt(res.jwt)
            commit('SET_TOKEN', res.token)
            resolve()
          }).catch(error => {
            reject(error)
          })
        } else {
          login(userInfo).then(res => {
            res = res.data;
            setToken(res.token)
            setJwt(res.jwt)
            commit('SET_TOKEN', res.token)
            if(res.tenantId){Cookies.set('tenantId', res.tenantId);}
            resolve()
          }).catch(error => {
            reject(error)
          })
        }

      })
    },

    // 社交登录
    SocialLogin({ commit }, userInfo) {
      const code = userInfo.code
      const state = userInfo.state
      const type = userInfo.type
      return new Promise((resolve, reject) => {
        socialLogin(type, code, state).then(res => {
          res = res.data;
          setToken(res.token)
          commit('SET_TOKEN', res.token);
          if(res.tenantId){Cookies.set('tenantId', res.tenantId);}
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 微信公众号新登录逻辑
    weChatSocialLogin({ commit }, userInfo) {

      return new Promise((resolve, reject) => {
        weChatSocialLogin(userInfo).then(res => {
          var result = res.data;
          if (result.status=='LOGIN_OK') {
            // 用户已注册且已关注，直接登录
            setToken(result.token);
            commit('SET_TOKEN', result.token);
            if (res.tenantId) {
              Cookies.set('tenantId', result.tenantId);
            }
          }
          resolve(res);

        }).catch(error => {
          console.error("社交登录失败", error);
          reject(error);
        });
      });
    },



    // 社交登录
    SocialLogin2({ commit }, userInfo) {
      const code = userInfo.code
      const state = userInfo.state
      const type = userInfo.type
      const username = userInfo.username.trim()
      const password = userInfo.password
      return new Promise((resolve, reject) => {
        socialLogin2(type, code, state, username, password).then(res => {
          res = res.data;
          setToken(res.token)
          commit('SET_TOKEN', res.token)
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 获取用户信息
    GetInfo({ commit, state }) {
      return new Promise((resolve, reject) => {
        getInfo(state.token).then(res => {
          // 没有 data 数据，赋予个默认值
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
            }
          }

          res = res.data; // 读取 data 数据

          const user = res.user;
          const id = user.id;
          Cookies.set('id', id);
          const avatar = user.avatar === "" ? require("@/assets/images/profile.jpg") : user.avatar;
          if (res.roles && res.roles.length > 0) { // 验证返回的roles是否是一个非空数组
            commit('SET_ROLES', res.roles)
            commit('SET_PERMISSIONS', res.permissions)
          } else {
            commit('SET_ROLES', ['ROLE_DEFAULT'])
          }
          commit('SET_ID', user.id)
          commit('SET_NAME', user.nickname)
          commit('SET_AVATAR', avatar);
          resolve(res)
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 退出系统
    LogOut({ commit, state }) {
      return new Promise((resolve, reject) => {
        logout(state.token).then(() => {
          commit('SET_TOKEN', '')
          commit('SET_ROLES', [])
          commit('SET_PERMISSIONS', [])
          removeToken()
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 前端 登出
    FedLogOut({ commit }) {
      return new Promise(resolve => {
        commit('SET_TOKEN', '')
        removeToken()
        resolve()
      })
    }
  }
}

export default user
