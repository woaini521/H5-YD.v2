import { useAppStore } from '@/store/app';
import { useCoreStore } from '@/store/core';
import { useCloud } from '@/utils/Hook/useRequest';
import { defineComponent, onMounted, Ref, ref } from 'vue-demi';
import css from './index.module.scss';

export default defineComponent({
  setup() {
    const core = useCoreStore()
    const app = useAppStore()

    const currentPage = ref(1) // 页码
    const isMore = ref(false) // 是否还有数据
    const plugleList: Ref<any[]> = ref([]) // 数据
    const activeKey = ref(1)
    onMounted(() => {
      resetInit()
      init()
      // 获取组件市场数据
    })
    function resetInit() {
      currentPage.value = 1
      plugleList.value = []
      isMore.value = false
    }
    function init() {
      let request
      if (activeKey.value == 1) {
        request = useCloud('pluginList')
      } else {
        request = useCloud('pluginList').where({
          _openid: app.userData.uid
        })
      }
      request.skip((currentPage.value - 1) * 10)
        .limit(10)
        .get()
        .then((res) => {
          console.log('请求完成', res.data);
          plugleList.value = plugleList.value.concat(res.data)
          isMore.value = res.data.length == 10
        })
    }

    function nextInit() {
      currentPage.value += 1
      init()
    }

    function changeTab() {
      resetInit()
      init()
    }

    function deleteItem(data, index) {
      useCloud('pluginList').doc(data._id).remove().then(res => {
        plugleList.value.splice(index, 1)
      })
    }
    
    return () => (
      <div class={css.plugin_list}>
        <a-tabs v-model={[activeKey.value, 'activeKey']} onChange={changeTab}>
          <a-tab-pane key={1} tab={"全部组件"}>
            {pluginItem({ plugleList, core, isMore, isMy: false }, { deleteItem, nextInit })}
          </a-tab-pane>
          <a-tab-pane key={2} tab={"我的组件"}>
            {pluginItem({ plugleList, core, isMore, isMy: true }, { deleteItem, nextInit })}
          </a-tab-pane>
        </a-tabs>
      </div>
    )
  }
})

function pluginItem({
  plugleList,
  core,
  isMore,
  isMy,

}, { deleteItem, nextInit }) {
  return (
    <div class={css.plugin_list_cont}>
      <div class={css.plugin_list_grid}>
        {
          plugleList.value.map((e, index) => (
            <div class={css.list_item}>
              {
                // 删除
                isMy && <a-popconfirm
                  title="删除该组件后,将会从组件市场消失"
                  ok-text="确认"
                  cancel-text="取消"
                  onConfirm={() => deleteItem(e, index)}
                >
                  <svg-icon class={css.delete_item} name="shanchu1" />
                </a-popconfirm>
              }
              {/* 主体 */}
              <a-image class={css.list_thmb} src={e.thmbImg} />
              {/* 使用 */}
              <div class={css.plugin_btn} onClick={() => core.usePlugin(e.content)}>
                使用组件
              </div>
            </div>
          ))
        }
      </div >
      {
        isMore.value ? <a-button type={"primary"} class={css.more_btn} onClick={nextInit}>加载更多</a-button>
          : <p class={css.more_btn}>没有更多数据了~</p>
      }
    </div>

  )
}