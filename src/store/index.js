// 引入 Vuex 中的 createStore 方法
import { createStore } from 'vuex'
import app from './modules/app'
import user from './modules/user'
import tagsView from './modules/tagsView'
import getters from './getters'

// 使用 createStore 创建 store 实例
const store = createStore({
  modules: {
    app,
    user,
    tagsView
  },
  getters
})

export default store
