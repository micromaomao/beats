import { createStore } from 'redux'
import { init as drawInit, drawFreeMode, updateFreeMode } from './draw.js'

// I know I shouldn't alter existing state objects, but I still do so for performance.
const userInputNumber = 4
let store = createStore(function (state, action) {
  console.log(action)
  switch (action.type) {
    case 'init':
      return {
        scene: 'free-mode',
        freeMode: freeModeInit()
      }
    case 'repaint':
      redraw()
      return state
    case 'tap':
      if (state.scene === 'free-mode') {
        let fm = state.freeMode
        if (fm.startTime === null) {
          fm.startTime = new Date().getTime()
          fm.userInputBlocks.push(0)
          return state
        } else if (fm.blocks.length === 0) {
          fm.userInputBlocks.push(new Date().getTime() - fm.startTime)
          return state
        }
      }
      return state
    default: return state
  }
})
window.AppState = store

function freeModeInit () {
  return {
    userInputBlocks: [],
    blocks: [],
    startTime: null
  }
}

let lastDrawState = null
function draw () {
  if (window.performance) {
    performance.mark('main-draw-begin')
  }
  try {
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
  } finally {
    if (!window.performance) return
    performance.mark('main-draw-end')
    performance.measure('Main draw', 'main-draw-begin', 'main-draw-end')
    performance.clearMarks()
  }
}

function redraw () {
  let st = store.getState()
  lastDrawState = st
  let drawArgs = {nextFrame, state: st}
  // TODO: catch exceptions
  switch (st.scene) {
    case 'free-mode':
      return void drawFreeMode(drawArgs)
    default: return void console.error(`Unknow scene ${st.scene}`)
  }
}

let nextFrameAF = null
function nextFrame () {
  if (nextFrameAF === null) {
    nextFrameAF = requestAnimationFrame(() => {
      nextFrameAF = null
      draw()
    })
  }
}

function init (obj) {
  drawInit(obj)
}

function handleTap ({x, y}) {
  store.dispatch({type: 'tap', x, y})
}

export {store, draw, init, handleTap as onTap}
