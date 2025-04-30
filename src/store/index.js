// 引入 Vuex 中的 createStore 方法
import { createStore } from 'vuex'
import app from './modules/app'
import user from './modules/user'
import tagsView from './modules/tagsView'
import lowCodeDict from './modules/lowCodeDict'
import getters from './getters'

// 使用 createStore 创建 store 实例
const store = createStore({
  modules: {
    app,
    user,
    tagsView,
    lowCodeDict
  },
  getters,
  state: {
    currentType: 'all',
    routeData: null,
  },
  mutations: {
    setRouteData(state, data) {
      state.routeData = data; // 设置 routeData
    },
    clearRouteData(state) {
      state.routeData = null; // 清空 routeData
    }
  }
})

export default store
