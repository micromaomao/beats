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
          fm.startTime = Date.now()
          fm.userInputBlocks.push(0)
          return state
        } else if (fm.blocks.length === 0) {
          fm.userInputBlocks.push(Date.now() - fm.startTime)
          if (fm.userInputBlocks.length >= userInputNumber) {
            let periods = new Array(fm.userInputBlocks.length - 1)
            for (let i = 0; i < fm.userInputBlocks.length - 1; i ++) {
              periods[i] = fm.userInputBlocks[i + 1] - fm.userInputBlocks[i]
            }
            let mean = periods.reduce((a, b) => a + b) / periods.length
            let roundedMean = Math.round(mean / 125) * 125
            if (Math.abs(roundedMean - mean) < 50) mean = roundedMean
            fm.periods = [mean, mean, mean, mean]
            return state
          }
          return state
        }
      }
      return state
    case 'fm-generate-blocks':
      let fm = state.freeMode
      if (!fm || !fm.periods) return state
      let lastBlockTime = null
      if (fm.blocks.length > 0) {
        lastBlockTime = fm.blocks[fm.blocks.length - 1].t
      } else if (fm.userInputBlocks.length > 0) {
        lastBlockTime = fm.userInputBlocks[fm.userInputBlocks.length - 1]
      }
      let lastBlockAppearTime = 0
      if (fm.blocks.length > 0) {
        lastBlockAppearTime = fm.blocks[fm.blocks.length - 1].appearTime
      }
      let appearTime = Math.max(Date.now(), lastBlockAppearTime)
      for (let p of fm.periods) {
        let nT = lastBlockTime + p
        fm.blocks.push({t: nT, appearTime})
        appearTime += 50
        lastBlockTime = nT
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
    periods: null,
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

function gameCheck () {
  let st = store.getState()
  if (st.scene === 'free-mode') {
    let fm = st.freeMode
    if (fm && fm.periods !== null && fm.blocks.length < 6) {
      store.dispatch({type: 'fm-generate-blocks'})
    }
    if (fm && fm.periods !== null) {
      setTimeout(gameCheck, fm.periods[0] / 2)
    }
  }
}
store.subscribe(gameCheck)

export {store, draw, init, handleTap as onTap}
