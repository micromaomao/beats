let ctx = null
let freeModeBackground = null
let blocksY = 0, secIndicaterY = 0
let lastSize = null
let needClearAll = true
const indicatorPeriod = 1000 / 4
const secIndicatorWidth = 2
const blocksHalfHeight = 30
const userInputBlocksTimeWidth = 20
const secIndicatorHalfHeight = 5
const stopTimeLogScale = 10
const tapLineHalfHeight = blocksHalfHeight * 6
let textY = 0
const textHeight = 80
let textGradiant = null
function init ({context}) {
  ctx = context
  handleResize()
}
function handleResize () {
  let {width, height} = ctx.canvas
  freeModeBackground = ctx.createLinearGradient(0, 0, 0, height)
  freeModeBackground.addColorStop(0, '#fffeb3')
  freeModeBackground.addColorStop(1, '#ffe28a')
  textGradiant = ctx.createLinearGradient(0, textY, 0, textHeight)
  textGradiant.addColorStop(0, '#666547')
  textGradiant.addColorStop(1, '#fb2e01')
  secIndicaterY = height * (2/3)
  blocksY = height * (1/3)
  textY = height / 8
  lastSize = {width, height}
  needClearAll = true
}
function update ({nextFrame, state}) {
  let {width, height} = ctx.canvas
  if (lastSize === null || lastSize.width !== width || lastSize.height !== height) {
    handleResize()
  }
  let now = Date.now()
  let stopTime = state.freeMode.stopTime
  let stopTimePass = 0
  if (stopTime) {
    stopTimePass = now - stopTime
    now = stopTime + (Math.log((stopTimePass) / stopTimeLogScale + 1) - 1) * stopTimeLogScale
  }
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
    if (needClearAll) {
      needClearAll = false
      ctx.fillRect(0, 0, width, height)
    } else {
      ctx.fillRect(0, secIndicaterY - secIndicatorHalfHeight * 3, width, secIndicatorHalfHeight * 6)
      ctx.fillRect(0, blocksY - blocksHalfHeight * 2, width, blocksHalfHeight * 4)
      ctx.fillRect(0, textY, width, textHeight)
    }
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
        ctx.rect(x - userInputBlocksTimeWidth / 2 * timeBase, blocksY - blocksHalfHeight, userInputBlocksTimeWidth * timeBase, blocksHalfHeight * 2)
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
      let droppingBlockDelay = 0
      for (let b of fm.blocks) {
        droppingBlockDelay += 50
        let x = (b.t - b.tWidth / 2) * timeBase - xOffset + midX
        if (x < 0 || x >= width) continue
        ctx.beginPath()
        let dropBlockYAdd = 0
        if (stopTimePass > 0) {
          dropBlockYAdd = Math.pow(Math.min(1, Math.max(0, (stopTimePass - droppingBlockDelay) / 500)), 2) * height
          needClearAll = true
        }
        ctx.rect(x, blocksY - blocksHalfHeight + dropBlockYAdd, b.tWidth * timeBase, blocksHalfHeight * 2)
        ctx.globalAlpha = Math.max(Math.min(1, (now - b.appearTime) / blockperiod), 0)
        ctx.fill()
      }
    ctx.restore()

    if (fm.lastTap) {
      let tap = fm.lastTap
      ctx.save()
        ctx.strokeStyle = '#666547'
        ctx.lineWidth = 2
        ctx.fillStyle = 'transparent'
        let x = tap.gt * timeBase - xOffset + midX
        let prog = (Date.now() - tap.t) / 400
        prog = Math.min(1, Math.max(0, prog))
        ctx.beginPath()
        let sY = blocksY - tapLineHalfHeight
        if (prog * 3 < 1) {
          ctx.moveTo(x, sY)
          ctx.lineTo(x, sY + prog * 3 * tapLineHalfHeight)
        } else if (prog * 3 < 2) {
          let nProg = prog * 3 - 1
          ctx.moveTo(x, sY + nProg * tapLineHalfHeight)
          ctx.lineTo(x, sY + tapLineHalfHeight + nProg * tapLineHalfHeight)
        } else if (prog * 3 < 3) {
          let nProg = prog * 3 - 2
          ctx.moveTo(x, sY + tapLineHalfHeight + tapLineHalfHeight * nProg)
          ctx.lineTo(x, sY + tapLineHalfHeight * 2)
        }
        ctx.stroke()

        if (tap.successful && tap.block && prog < 1 - 0.01) {
          let b = tap.block
          let bx = b.t * timeBase - xOffset + midX
          let bx1 = (b.t - b.tWidth / 2) * timeBase - xOffset + midX
          let bx2 = bx1 + b.tWidth * timeBase
          let tapX = tap.gt * timeBase - xOffset + midX
          let fallProg = prog * 3 - 1
          fallProg = Math.max(0, Math.min(1, fallProg))
          let bBottomY = blocksY + blocksHalfHeight + Math.pow(fallProg, 2) * height
          let rotation = fallProg * Math.PI / 4
          ctx.save()
            ctx.fillStyle = '#fb2e01'
            let leftRightX = tapX - fallProg * width / 4
            ctx.save()
              ctx.translate(leftRightX, bBottomY)
              ctx.rotate(-rotation)
              ctx.beginPath()
              ctx.rect(-(tapX - bx1), -blocksHalfHeight * 2, tapX - bx1, blocksHalfHeight * 2)
              ctx.fill()
            ctx.restore()
            let rightLeftX = tapX + fallProg * width / 4
            ctx.translate(rightLeftX, bBottomY)
            ctx.beginPath()
            ctx.rotate(rotation)
            ctx.rect(0, -blocksHalfHeight * 2, bx2 - tapX, blocksHalfHeight * 2)
            ctx.fill()
          ctx.restore()
        }
      ctx.restore()
      needClearAll = true
    }

    if (fm.periodDeterminedTime !== null) {
      let prog = Math.max(0, Math.min(1, (Date.now() - fm.periodDeterminedTime) / 300))
      ctx.save()
        ctx.fillStyle = textGradiant
        ctx.globalAlpha = prog
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.font = `${textHeight / 2 / 2}px sans-serif`
        ctx.fillText(`${Math.round(1 / (fm.periods[0] / 1000) * 10) / 10} Hz (${Math.round(60000 / fm.periods[0] * 10) / 10} / min)`, width / 2, textY + textHeight / 2, width)
        ctx.textBaseline = 'top'
        ctx.font = `${textHeight / 2}px sans-serif`
        ctx.fillText(state.score, width / 2, textY + textHeight / 2, width)
      ctx.restore()
    }
  }
}

export { update, init }
