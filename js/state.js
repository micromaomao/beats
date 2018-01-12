import { createStore } from 'redux'
import { init as drawInit, drawFreeMode, updateFreeMode } from './draw.js'

let store = createStore(function (state, action) {
  switch (action.type) {
    case 'init':
      return {
        scene: 'free-mode'
      }
    case 'nextframe': return state
    default: return state
  }
})
window.AppState = store

let lastDrawState = null
function draw () {
  if (!store.getState()) return void nextFrame()
  if (lastDrawState === null) {
    return void redraw()
  }
  let st = store.getState()
  let updateArgs = {nextFrame, redraw, lastDrawState, state: st}
  if (lastDrawState.scene === st.scene) {
    if (st.scene === 'free-mode') return void updateFreeMode(updateArgs)
    return void redraw()
  }
}

function redraw () {
  let st = store.getState()
  lastDrawState = st
  // TODO: catch exceptions
  switch (st.scene) {
    case 'free-mode':
      return void drawFreeMode({nextFrame})
    default: return void console.error(`Unknow scene ${st.scene}`)
  }
}

let nextFrameAF = null
function nextFrame () {
  if (nextFrameAF === null) {
    nextFrameAF = requestAnimationFrame(() => {
      nextFrameAF = null
      store.dispatch({type: 'nextframe'})
    })
  }
}

function init (obj) {
  drawInit(obj)
}

export {store, draw, init}
