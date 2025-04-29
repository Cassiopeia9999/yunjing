// import variables from '@/assets/styles/element-variables.scss'
import themes from "@/assets/styles/theme.json"

import defaultSettings from '@/settings'
import {setSideTheme, setTheme} from "@/assets/styles/setTheme.js";

const {
  title,
  sideTheme,
  showSettings,
  tagsView,
  fixedHeader,
  sidebarLogo,
  sidebarLogoUrl,
  sidebarSmallLogoUrl
} = defaultSettings

const state = {
  // theme: variables.theme,
  theme: localStorage.getItem('themeColor') || themes["defaultSetting"]["--primary"],
  sideTheme: localStorage.getItem('sideTheme') || sideTheme,
  title: title,
  showSettings: showSettings,
  tagsView: tagsView,
  fixedHeader: fixedHeader,
  sidebarLogo: sidebarLogo,
  logo: null,
}

const mutations = {
  CHANGE_SETTING: (state, {key, value}) => {
    if (state.hasOwnProperty(key)) {
      state[key] = value;
      if (key === 'sideTheme') {
        setSideTheme(value || sideTheme);
      }else if(key === 'theme'){
        setTheme(value || themes["defaultSetting"]["--primary"]);
      }
    }
  }
}

const actions = {
  changeSetting({commit}, data) {
    commit('CHANGE_SETTING', data)
  },
  changeSiteSetting({}, data) {
    let title = 'pageTitle';
    let pageTitle = data.pageTitle? data.pageTitle : '云镜';
    state[title] = pageTitle;
    document.title = pageTitle;
  }
}


export default {
  namespaced: true,
  state,
  mutations,
  actions
}

