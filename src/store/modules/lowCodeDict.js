import request from '@/utils/request'

const state = {
  /**
   * 数据字典 MAP
   * key：数据字典大类枚举值 dictType
   * dictValue：数据字典小类数值 {dictValue: '', dictLabel: ''} 的数组
   */
  lowCodeDictData: {}
}

const mutations = {
  SET_LOWCODE_DICT_DATA: (state, dictDatas) => {
    state.lowCodeDictData = dictDatas
  }
}

const actions = {
  loadLowCodeDictData({ commit }) {
    request({
      url: '/lowcode/dict-info/listAdd',
      method: 'get',
    }).then(response => {
      // 如果未加载到数据，则直接返回
      if (!response || !response.data) {
        return;
      }
      // 设置数据
      const dictDataMap = {}
      response.data.forEach(dictData => {
        // 获得 dictType 层级
        const enumValueObj = dictDataMap[dictData.tableName+dictData.dictType]
        if (!enumValueObj) {
          dictDataMap[dictData.tableName+dictData.dictType] = []
        }
        // 处理 dictValue 层级
        dictDataMap[dictData.tableName+dictData.dictType].push({
          value: dictData.dictValue,
          label: dictData.dictLabel
        })
      })
      // 存储到 Store 中
      // console.log(dictDataMap);
      commit('SET_LOWCODE_DICT_DATA', dictDataMap)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
