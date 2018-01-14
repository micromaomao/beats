import { createStore } from 'redux'
import { init as drawInit, update as drawUpdate } from './draw.js'

// I know I shouldn't alter existing state objects, but I still do so for performance.
const userInputNumber = 8
const freeModeInit = {
  userInputBlocks: [],
  blocks: [],
  periods: null,
  startTime: null,
  stopTime: null,
  lastTap: null,
  periodDeterminedTime: null
}
let store = createStore(function (state, action) {
  console.log(action)
  switch (action.type) {
    case 'init':
      return {
        scene: 'free-mode',
        score: 0,
        showInitScreen: true,
        maxScore: action.maxScore || 0,
        freeMode: Object.assign({}, freeModeInit, {
          userInputBlocks: [],
          blocks: []
        })
      }
    case 'repaint': return state
    case 'tap':
      if (state.scene === 'free-mode') {
        let fm = state.freeMode
        if (fm.startTime === null) {
          fm.startTime = Date.now()
          fm.userInputBlocks.push(0)
          return state
        } else if (fm.periods === null) {
          fm.userInputBlocks.push(Date.now() - fm.startTime)
          if (fm.userInputBlocks.length >= userInputNumber) {
            let periods = new Array(fm.userInputBlocks.length - 1)
            for (let i = 0; i < fm.userInputBlocks.length - 1; i ++) {
              periods[i] = fm.userInputBlocks[i + 1] - fm.userInputBlocks[i]
            }
            let mean = periods.reduce((a, b) => a + b) / periods.length
            let roundedMean = Math.round(mean / 125) * 125
            if (Math.abs(roundedMean - mean) < 10) mean = roundedMean
            fm.periods = [mean, mean, mean, mean]
            fm.periodDeterminedTime = Date.now()
            return state
          }
          return state
        } else if (fm.blocks.length > 0 && fm.stopTime === null) {
        let firstBlock = fm.blocks[0]
        let gameTime = Date.now() - fm.startTime
          let devid = Math.abs(firstBlock.t - gameTime)
          if (devid < firstBlock.tWidth) {
            let [tappedBlock] = fm.blocks.splice(0, 1)
            fm.lastTap = {
              t: Date.now(),
              gt: gameTime,
              successful: true,
              block: tappedBlock
            }
            state.score += Math.floor(Math.pow(2, 1 - 2.5 * (devid / firstBlock.tWidth - 0.9)))
            if (state.score > state.maxScore) state.maxScore = state.score
            return state
          } else {
            fm.stopTime = Date.now()
            fm.lastTap = {
              t: Date.now(),
              gt: gameTime,
              successful: false
            }
          }
        } else if (fm.stopTime !== null && Date.now() - fm.stopTime > 1000) {
          state.showInitScreen = false
          state.score = 0
          state.freeMode = Object.assign({}, freeModeInit, {
            startTime: Date.now(),
            userInputBlocks: [0],
            blocks: []
          })
        }
      }
      return state
    case 'fm-generate-blocks':
      if (state.scene === 'free-mode') {
        let fm = state.freeMode
        if (!fm || !fm.periods) return state
        let lastBlockTime = null
        if (fm.blocks.length > 0) {
          lastBlockTime = fm.blocks[fm.blocks.length - 1].t
        } else if (fm.userInputBlocks.length > 0) {
          lastBlockTime = fm.userInputBlocks[fm.userInputBlocks.length - 1]
        }
        let lastBlockAppearTime = 0
        let lastBlockTWidth = 150
        if (fm.blocks.length > 0) {
          let lastBlock = fm.blocks[fm.blocks.length - 1]
          lastBlockAppearTime = lastBlock.appearTime
          lastBlockTWidth = lastBlock.tWidth
        }
        let appearTime = Math.max(Date.now(), lastBlockAppearTime)
        for (let p of fm.periods) {
          let nT = lastBlockTime + p
          fm.blocks.push({t: nT, appearTime, tWidth: lastBlockTWidth * (19/20)})
          appearTime += 50
          lastBlockTime = nT
        }
      }
      return state
    case 'first-block-miss':
      if (state.scene === 'free-mode') {
        let fm = state.freeMode
        if (!fm || fm.blocks.length === 0) return state
        fm.stopTime = Date.now()
        fm.blocks[0].missed = true
      }
      return state
    default: return state
  }
})
window.AppState = store

function draw () {
  if (window.performance && performance.mark) {
    performance.mark('main-draw-begin')
  }
  try {
    if (!store.getState()) return void nextFrame()
    let st = store.getState()
    let updateArgs = {nextFrame, state: st}
    return void drawUpdate(updateArgs)
  } finally {
    if (!window.performance || !performance.mark) return
    performance.mark('main-draw-end')
    performance.measure('Main draw', 'main-draw-begin', 'main-draw-end')
    performance.clearMarks()
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
  let now = Date.now()
  if (st.scene === 'free-mode') {
    let fm = st.freeMode
    if (fm && fm.stopTime === null) {
      if (fm && fm.periods !== null) {
        if (fm.blocks.length < 6) {
          store.dispatch({type: 'fm-generate-blocks'})
        }
        let firstBlock = fm.blocks[0]
        let gameTime = now - fm.startTime
        if (firstBlock.t < gameTime - firstBlock.tWidth) {
          store.dispatch({type: 'first-block-miss'})
        }
      }
    }
    if (fm && fm.periods !== null) {
      setTimeout(gameCheck, fm.periods[0] / 2)
    }
  }
}
store.subscribe(gameCheck)

export {store, draw, init, handleTap as onTap}
