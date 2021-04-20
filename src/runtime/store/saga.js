/**
 * **Saga Model转换插件**
 * 用于将旧模块采用的saga model转换成rematch的model
 * 参考https://github.com/alhimik45/rematch-saga 实现并加以改动
 */

import createSagaMiddleware from 'redux-saga'
import { validate } from 'toss.utils'

export default (sagaMiddleware = createSagaMiddleware()) => ({
  config: {
    redux: {
      middlewares: [sagaMiddleware],
    },
  },
  exposed: {
    /**
     * **扩展dispatch功能**
     * - 兼容saga和rematch两种payload传入方式
     * - 在每个dispach前后分别更新该action的loading状态
     */
    async dispatch({ type, payload, preventLoading = false }) {
      let result = null

      if (payload && payload.payload) {
        preventLoading = payload.preventLoading
        payload = payload.payload
      }

      payload = payload || { payload: {} }
      // 开启action type的loading状态
      !preventLoading && this.storeDispatch({ type: 'loading/startLoading', payload: type })

      /**
       * *兼容saga和rematch两种payload传入方式*
       * rematch的dispatch是将参数中除了type之外的其他属性都作为payload来处理
       * 例如：
       * dispatch({
       *   type: 'action/setState',
       *   name: 'Tom',
       *   age: 21
       * })
       * redux-saga则是需要在dispatch的时候显示地指定payload属性，也可以传入并列的其他属性，例如callback等
       * 例如：
       * dispatch({
       *   type: 'action/setState',
       *   payload: {
       *     name: 'Tom',
       *     age: 21
       *   },
       *   callback: console.log
       * })
       * 按照以往使用redux-saga的经验，在effetc中接收payload的时候是如下格式：
       * effects: {
       *   * setState ({ payload }) {
       *     yield someAsyncAPI(payload)
       *   }
       * }
       * *我们统一采用redux-saga的格式以减少老模块迁移的成本*
       * 为此我们对dispatch的参数进行判断和重新组装
       * - 如果payload中存在payload属性（redux-saga dispatch规则），则将这个payload直接作为payload属性传给storeDispatch
       * - 否则用这个payload再包装一层后传给storeDispatch
       * 经过上面的处理之后，在effetcs中便可按照redux-saga的格式接收payload
       * eslint hasOwnProperty 兼容方法
       */
      try {
        if (payload && Object.prototype.hasOwnProperty.call(payload, 'payload')) {
          result = await this.storeDispatch({ type, payload })
        } else {
          result = await this.storeDispatch({ type, payload: { payload } })
        }

        // 结束action type的loading状态
        !preventLoading && this.storeDispatch({ type: 'loading/endLoading', payload: type })

        // 返回dispatch执行结果
        return result
      } catch (error) {
        // 发生错误后结束action type的loading状态，并继续抛出错误
        !preventLoading && this.storeDispatch({ type: 'loading/endLoading', payload: type })
        throw error
      }
    },
  },
  onModel(model) {
    // 兼容saga model的namespace
    if (model.namespace && !model.name) {
      model.name = model.namespace
    }

    // 若effetcs是一个函数，则传入dispatch参数调用它，并将返回结果作为effetcs对象
    const effects = typeof model.effects === 'function' ? model.effects(this.dispatch) : model.effects

    if (!effects) {
      return
    }

    // 为dispatch新增快捷调用功能
    this.dispatch[model.name] = this.dispatch[model.name] || {}

    // 遍历最终effetcs进行转换处理
    for (const effectName of Object.keys(effects)) {
      const fn = effects[effectName]
      /**
       * 只有**generator**函数才会执行转换处理
       */
      if (validate.isGeneratorFunction(fn)) {
        const boundFn = fn.bind(this.dispatch[model.name])

        // 通过sagaMiddleware来运行saga effect并返回promise对象
        // 创建select/call/put这三个函数，在saga effect中会需要用到
        this.effects[`${model.name}/${effectName}`] = (payload, state) => {
          // 返回一个可取消的Promise对象
          return sagaMiddleware
            .run(boundFn, payload, {
              select: fn => fn(state),
              call: (fn, args) => fn(args),
              put: ({ type, payload, preventLoading = false }) =>
                this.dispatch({
                  type: type.indexOf('/') === -1 ? `${model.name}/${type}` : type,
                  preventLoading: preventLoading,
                  payload: { payload },
                }),
            })
            .toPromise()
        }

        // 绑定dispatch快捷调用语法糖
        this.dispatch[model.name][effectName] = this.createDispatcher.apply(this, [model.name, effectName])
        // 打标记以便于部分场合区分是rematch的action还是saga的action
        this.dispatch[model.name][effectName].isSagaEffect = true
      }
    }
  },
})
