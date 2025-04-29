import Vue from 'vue'
import Vuex from 'vuex'
import app from './modules/app'
import user from './modules/user'
import tagsView from './modules/tagsView'
import permission from './modules/permission'
import settings from './modules/settings'
import dict from './modules/dict'
import lowCodeDict from './modules/lowCodeDict'
import getters from './getters'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    app,
    user,
    tagsView,
    permission,
    settings,
    dict,
    lowCodeDict
  },
  getters,
  state: {
  	currentType: 'all',
    routeData: null,
  },
  mutations: {
    setRouteData(state, data) {
      state.routeData = data;
    },
    clearRouteData(state) {
      state.routeData = null;
    }
  }
})

export default store
