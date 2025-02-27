import { baseAnimation, baseComList, baseComponent } from '@/modules/components'
import { deepClone, guid } from '@/utils/index'
import { message } from 'ant-design-vue'
import { defineStore } from 'pinia'
import { watch } from 'vue-demi'
import History from './plugin/History'

// 时间旅行
let history = new History()

export const useCoreStore = defineStore('core', {
  state: () => {
    return {
      acPageIndex: 0, // 当前选中的页面
      activeCompIndex: -1, // 当前选中的组件下标
      hoverCompIndex: -1, // 当前hover的组件下标
      pageData: [] as { name: string; id: string; dom: any[] }[],
      isMeta: false, // 是否按住command
      moveIndex: 0, // 当前拖动类型 1-8 坐标点 9 底部高度条 10 按住元素
      downState: false, // 当前是否按住了鼠标
      lockCompId: [] as string[], // 被锁定的组件(id)
    }
  },
  getters: {
    carryPageComp: (state) => {
      return state.pageData[state.acPageIndex]
    },
    carryComp: (state) => {
      return state.pageData[state.acPageIndex].dom[state.activeCompIndex]
    },
    carryCss: (state) => {
      return state.pageData[state.acPageIndex].dom[state.activeCompIndex].cssModule
    },
    carryAn: (state): any[] => {
      return state.pageData[state.acPageIndex].dom[state.activeCompIndex].animation
    },
    carryConfig: (state) => {
      return state.pageData[state.acPageIndex].dom[state.activeCompIndex].staticData
    },
  },
  actions: {
    addPage() {
      this.resetCompActive()
      this.pageData.push(this.pageDataItem())
      this.acPageIndex = this.pageData.length - 1
    },
    pageDataItem() {
      return pageDataItem(this.pageData.length)
    },
    resetCompActive() {
      this.activeCompIndex = -1
      this.hoverCompIndex = -1
    },
    addComp(name: string, css?) {
      let maxzIndex = getMaxzIndex(this.pageData, this.acPageIndex)
      let comp = baseComList(name, maxzIndex + 1)
      if (comp && css) {
        comp.cssModule.top = css.top - comp.cssModule.height / 2
        comp.cssModule.left = css.left - comp.cssModule.width / 2
      }
      this.pageData[this.acPageIndex].dom.push(comp)
      // 默认选中新添加的组件
      this.activeCompIndex = this.pageData[this.acPageIndex].dom.length - 1
      this.hoverCompIndex = this.pageData[this.acPageIndex].dom.length - 1
    },
    deleteComp(index) {
      if (index == -1) {
        message.error('当前未选中组件')
      } else {
        this.pageData[this.acPageIndex].dom.splice(index, 1)
        this.activeCompIndex = -1
      }
    },
    lockComp(id: string, type) {
      if (type) {
        this.lockCompId.push(id)
      } else {
        let index = this.lockCompId.findIndex((e) => e == id)
        this.lockCompId.splice(index, 1)
      }
    },
    switchShowComp(index: number, type: boolean) {
      this.pageData[this.acPageIndex][index].show = type
    },
    toggleComp(index: number) {
      this.activeCompIndex = index
      // 判断是否被锁
      let id = this.pageData[this.acPageIndex].dom[index].id
      if (!this.lockCompId.includes(id)) {
        this.changeMoveIndex(10)
      } else {
        console.log('被锁住')
      }
    },
    // 切换拖动类型
    changeMoveIndex(index: number) {
      if (this.moveIndex == 0) {
        this.moveIndex = index
      }
      if (index == 0) {
        this.moveIndex = 0
      }
    },
    // 增加动画
    addAnimation() {
      this.carryAn.push(baseAnimation())
    },
    // 从组件市场增加组件
    usePlugin(data) {
      console.log(data)
      let maxzIndex = getMaxzIndex(this.pageData, this.acPageIndex)
      data.cssModule.top = 20
      data.cssModule.left = 20
      data.cssModule['z-index'] = maxzIndex
      data.id = guid()
      this.pageData[this.acPageIndex].dom.push(deepClone(data))
      message.success('组件导入成功~')
    },
    // 从模板市场增加页面
    useTemplate(data) {
      console.log(data)
      this.pageData.push({
        ...this.pageDataItem(),
        dom: data,
      })
      this.acPageIndex = this.pageData.length - 1
      this.resetCompActive()
      message.success('页面导入成功~')
    },
    // 撤销
    revoke() {
      core.pageData = history.replaceState()
      this.resetCompActive()
    },
    // 恢复
    recovery() {
      core.pageData = history.unReplaceState()
      this.resetCompActive()
    },
  },
})

export function pageDataItem(num) {
  return {
    name: '页面' + (num + 1),
    id: guid(),
    dom: [],
  }
}

/**
 * 获取最高层级
 */
function getMaxzIndex(pageData, acPageIndex) {
  let maxzIndex = 0
  pageData[acPageIndex].dom.map((res) => {
    maxzIndex = res.cssModule['z-index'] > maxzIndex ? res.cssModule['z-index'] : maxzIndex
  })
  return maxzIndex
}

// 时间旅行功能
const core = useCoreStore()
watch(
  () => core.pageData,
  (state) => {
    history.setState(state)
  },
  { deep: true }
)
