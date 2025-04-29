import {
  constantRoutes
} from '@/router'
import {
  getRouters
} from '@/api/menu'
import Layout from '@/layout/index'
import ParentView from '@/components/ParentView';
import designer from '@/components/formGenerator/formDesigner'
import {
  getProcessDefinitionBpmnXML,
  getProcessDefinitionList
} from "@/api/bpm/definition";

import {
  getReleaseTableIcons,
} from "@/api/lowcode/tableInfo";

import Cookies from "js-cookie";

const permission = {
  state: {
    routes: [],
    addRoutes: [],
    sidebarRouters: []
  },
  mutations: {
    SET_ROUTES: (state, routes) => {
      state.addRoutes = routes
      state.routes = constantRoutes.concat(routes)
    },
    SET_SIDEBAR_ROUTERS: (state, routers) => {
      state.sidebarRouters = constantRoutes.concat(routers)
    },
  },
  actions: {
    // 生成路由
    GenerateRoutes ({
      commit
    }) {
      return new Promise(resolve => {
        // 向后端请求路由数据
        getRouters().then(res => {
          const sdata = JSON.parse(JSON.stringify(res.data))
          const rdata = JSON.parse(JSON.stringify(res.data))
          const sidebarRoutes = filterAsyncRouter(sdata)
          let rewriteRoutes = filterAsyncRouter(rdata, true)
          let routes = [];
          rewriteRoutes.push({
            path: '*',
            redirect: '/404',
            hidden: true
          })
          //add by penghui 增加流程菜单路由
          getProcessDefinitionList({
            suspensionState: 1
          }).then(response => {
            routes = [].concat(response.data);
            const tenantId = Cookies.get('tenantId');
            getReleaseTableIcons(tenantId).then(response => {
              routes = [...routes].concat(response.data);
              let children = [];
              for (let menu of routes) {
                let item = {
                  path: 'dynamicInfo/index/' + menu.formId,
                  component: (resolve) => require(['@/views/lowcode/dynamicInfo/index'], resolve),
                  name: menu.formName || menu.name,
                  meta: {
                    title: menu.formName || menu.name,
                    icon: "#" + menu.icon,
                    formId: menu.formId
                  },
                }
                children.push(item);
              }
              let dynaMenu = {
                path: '/lowcode',
                component: Layout,
                hidden: true,
                children: children,
              }
              rewriteRoutes.push(dynaMenu);
              commit('SET_ROUTES', rewriteRoutes)
              commit('SET_SIDEBAR_ROUTERS', sidebarRoutes)
              resolve(rewriteRoutes)
            }).catch((err) => {
              //登录超时，跳转首页
              commit('SET_ROUTES', rewriteRoutes)
              commit('SET_SIDEBAR_ROUTERS', sidebarRoutes)
              resolve(rewriteRoutes)
            })
          }).catch((err) => {
            //登录超时，跳转首页
            commit('SET_ROUTES', rewriteRoutes)
            commit('SET_SIDEBAR_ROUTERS', sidebarRoutes)
            resolve(rewriteRoutes)
          })
        })
      })
    }
  }
}

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter (asyncRouterMap, isRewrite = false) {
  return asyncRouterMap.filter(route => {
    // 将 ruoyi 后端原有耦合前端的逻辑，迁移到此处
    // 处理 meta 属性
    route.meta = {
      title: route.name,
      icon: route.icon,
      id: route.id,
    }
    if(route.path.indexOf('?') > -1){
      let q = route.path.split('?')[1].split('&');
      route.path = route.path.split('?')[0];
      route.query = {};
      for (let i = 0; i < q.length; i++) {
        let kv = q[i].split('=');
        route.query[kv[0]] = kv.length > 1 ? kv[1] : true
      }
    }

    // 处理 component 属性
    if (route.children) { // 父节点
      // debugger
      if (route.parentId === 0) {
        route.component = Layout
      } else {
        route.component = ParentView
      }
    } else { // 根节点
      if (route.path.indexOf('/board/boardShow') != -1) {
        route.path = "/board/boardShow/" + route.id;
        route.component = (resolve) => require(['@/views/board/index'], resolve);
      } else if (route.path.indexOf('lowcode/dynamicInfo/') != -1) {// 处理动态表单自动添加菜单
        let path = route.path;
        route.component = (resolve) => require(['@/views/lowcode/dynamicInfo/index'], resolve);
        route.name = "dynamicInfo";
        route.meta.formId = path.replace("lowcode/dynamicInfo/", "");
      } else if (route.path.indexOf('lowcode/dynamicWorkflow/') !== -1) {
            let path = route.path;
           if (route.query && route.query.special) {
              // 处理带有特殊参数的路径
              const specialParam =route.query.special;
              route.component = (resolve) => require(['@/views/bpm/processInstance/create_'+specialParam], resolve);
              route.name = "ProcessInstanceCreate_"+route.query.special;
              route.meta.workflowId = path.replace(/^.*lowcode\/dynamicWorkflow\//, "");
           } else {
              route.component = (resolve) => require(['@/views/bpm/processInstance/create'], resolve);
              route.name = "ProcessInstanceCreate";
              route.meta.workflowId = path.replace(/^.*lowcode\/dynamicWorkflow\//, "");
           }
      } else if (route.path.indexOf('jm-view/') != -1) {
        let path = route.path;
        route.component = loadView(route.component);
        route.name = 'jmView';
        route.meta.id = path.replace(/^.*jm-view\//, '');
      } else if (route.path.indexOf('gis/layers') != -1) {
        let path = route.path;
        route.component = (resolve) => require(['@/views/visualization/gis/layers'], resolve);
        route.name = "gisLayers";
        route.meta.formId = path.replace(/^.*gis\/layers\//, "");
      } else if (route.path.indexOf('lowcode/video/') != -1) {
        let path = route.path;
        route.component = (resolve) => require(['@/views/lowcode/video/index'], resolve);
        route.name = "videoFlow";
        route.meta.formId = path.replace(/^.*lowcode\/video\//, "");
      } else if (route.path.indexOf('lowcode/logicvideo/') != -1) {
        let path = route.path;
        route.component = (resolve) => require(['@/views/lowcode/logicvideo/index'], resolve);
        route.name = "logicVideoFlow";
        route.meta.formId = path.replace(/^.*lowcode\/logicvideo\//, "");
      } else {
        route.component = loadView(route.component)
      }
    }

    // filterChildren
    if (isRewrite && route.children) {
      route.children = filterChildren(route.children)
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, isRewrite)
    }
    return true
  })
}

// Helper function to get query parameter from URL
function getConditionParam(name, url) {
  name = name.replace(/[[]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Helper function to capitalize the first letter of a string
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function filterChildren (childrenMap) {
  var children = []
  childrenMap.forEach((el, index) => {
    if (el.children && el.children.length) {
      if (el.component === 'ParentView') {
        el.children.forEach(c => {
          c.path = el.path + '/' + c.path
          if (c.children && c.children.length) {
            children = children.concat(filterChildren(c.children, c))
            return
          }
          children.push(c)
        })
        return
      }
    }
    children = children.concat(el)
  })
  return children
}

export const loadView = (view) => { // 路由懒加载
  return (resolve) => require([`@/views/${view}`], resolve)
}

export default permission
