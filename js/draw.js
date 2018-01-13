let ctx = null
let freeModeBackground = null
let blocksY = 0, secIndicaterY = 0
function init ({context}) {
  ctx = context
  handleResize()
}
function handleResize () {
  let {width, height} = ctx.canvas
  freeModeBackground = ctx.createLinearGradient(0, 0, 0, height)
  freeModeBackground.addColorStop(0, '#fffeb3')
  freeModeBackground.addColorStop(1, '#ffe28a')
  secIndicaterY = height * (2/3)
  blocksY = height * (1/3)
  lastSize = {width, height}
}
let lastSize = null
function drawFreeMode ({state, nextFrame}) {
  let {width, height} = ctx.canvas
  if (lastSize === null || lastSize.width !== width || lastSize.height !== height) {
    handleResize()
  }
  ctx.save()
    ctx.fillStyle = freeModeBackground
    ctx.fillRect(0, 0, width, height)
  ctx.restore()
  nextFrame() // more stuff drawn by updateFreeMode
}

const indicatorPeriod = 1000 / 4
const secIndicatorWidth = 2
const blocksHalfWidth = 5
const blocksHalfHeight = 30
const secIndicatorHalfHeight = 5
function updateFreeMode ({nextFrame, redraw, lastDrawState, state}) {
  let {width, height} = ctx.canvas
  let now = Date.now()
  let timeBase = (200 + width * 0.1) / 1000 // pixel / ms
  let startTime = state.freeMode.startTime
  if (startTime === null) {
    startTime = now
  } else {
    nextFrame()
  }
  let xOffset = (now - startTime) * timeBase
  let midX = width / 2
  ctx.save()
    ctx.fillStyle = freeModeBackground
    ctx.fillRect(0, secIndicaterY - secIndicatorHalfHeight * 3, width, secIndicatorHalfHeight * 6)
    ctx.fillRect(0, blocksY - blocksHalfHeight * 2, width, blocksHalfHeight * 4)
  ctx.restore()
  drawIndicator()
  drawBlocks()

  function drawIndicator () {
    let indicatorTB = timeBase * indicatorPeriod
    ctx.save()
      ctx.strokeStyle = '#666547'
      ctx.fillStyle = 'transparent'
      ctx.lineCap = 'butt'
      ctx.lineWidth = secIndicatorWidth
      ctx.beginPath()
      for (let diX = midX - (xOffset % indicatorTB) - (Math.ceil(midX / indicatorTB) + 1) * indicatorTB; diX < width; diX += indicatorTB) {
        let thisTime = (diX - midX + xOffset) / timeBase + 0.001
        if (thisTime < 0) continue
        let extend = 1
        if (Math.abs(thisTime / 1000 - Math.round(thisTime / 1000)) < 0.001) {
          extend = 2
        }
        ctx.moveTo(diX, secIndicaterY - secIndicatorHalfHeight * extend)
        ctx.lineTo(diX, secIndicaterY + secIndicatorHalfHeight * extend)
      }
      ctx.stroke()
    ctx.restore()
  }

  function drawBlocks () {
    let fm = state.freeMode
    let timeOffset = now - startTime
    ctx.save()
      ctx.beginPath()
      for (let b of fm.userInputBlocks) {
        let x = b * timeBase - xOffset + midX
        if (x < 0 || x >= width) continue
        ctx.rect(x - blocksHalfWidth, blocksY - blocksHalfHeight, blocksHalfWidth * 2, blocksHalfHeight * 2)
      }
      ctx.fillStyle = '#6fcb9f'
      ctx.strokeStyle = 'transparent'
      ctx.lineWidth = 0
      ctx.fill()
    ctx.restore()

    let blockperiod = 200
    if (fm.periods && fm.periods.length > 0) {
      blockperiod = fm.periods[fm.periods.length - 1]
    }
    ctx.save()
      ctx.strokeStyle = 'transparent'
      ctx.lineWidth = 0
      ctx.fillStyle = '#fb2e01'
      for (let b of fm.blocks) {
        let x = b.t * timeBase - xOffset + midX
        if (x < 0 || x >= width) continue
        ctx.beginPath()
        ctx.rect(x - blocksHalfWidth, blocksY - blocksHalfHeight, blocksHalfWidth * 2, blocksHalfHeight * 2)
        ctx.globalAlpha = Math.max(Math.min(1, (now - b.appearTime) / blockperiod), 0)
        ctx.fill()
      }
    ctx.restore()
  }
}

export { drawFreeMode, updateFreeMode, init }
