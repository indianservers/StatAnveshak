export type StageCaption = {
  title: string
  intuition: string
  formula: string
  readout: string
  misuse: string
}

export function plainFormula(formula: string) {
  return formula
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm/g, '')
    .replace(/\\hat\{([^}]+)\}/g, '$1-hat')
    .replace(/\\bar\{([^}]+)\}/g, '$1-bar')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\,/g, ' ')
    .replace(/\\mid/g, '|')
    .replace(/\\propto/g, 'propto')
    .replace(/\\xrightarrow\{[^}]*\}/g, '->')
    .replace(/\\/g, '')
    .replace(/[{}^_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function wrapSvgForExport(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', '720')
  clone.setAttribute('height', '420')
  clone.setAttribute('viewBox', svg.getAttribute('viewBox') || '0 0 720 420')
  return clone
}

export function captionLines(caption: StageCaption) {
  return {
    intuition: caption.intuition,
    formula: plainFormula(caption.formula),
    caveat: caption.misuse,
    readout: caption.readout,
  }
}

export async function stageToPngDataUrl(svg: SVGSVGElement, caption: StageCaption): Promise<string> {
  const clone = wrapSvgForExport(svg)
  const xml = new XMLSerializer().serializeToString(clone)
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const image = await loadImage(url)
    const captionHeight = 132
    const canvas = document.createElement('canvas')
    canvas.width = 1440
    canvas.height = 840 + captionHeight * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available.')
    ctx.fillStyle = '#020617'
    ctx.fillRect(0, 0, canvas.width, 840)
    ctx.drawImage(image, 0, 0, 1440, 840)
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 840, canvas.width, captionHeight * 2)
    ctx.fillStyle = '#0f172a'
    ctx.font = '600 28px Inter, system-ui, sans-serif'
    ctx.fillText(caption.title.slice(0, 72), 40, 890)
    ctx.font = '22px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#334155'
    wrapText(ctx, `Intuition: ${caption.intuition}`, 40, 940, 1360, 30)
    ctx.fillText(`Formula: ${plainFormula(caption.formula)}`, 40, 1010)
    ctx.fillStyle = '#92400e'
    wrapText(ctx, `If you break it: ${caption.misuse}`, 40, 1055, 1360, 30)
    ctx.fillStyle = '#4338ca'
    ctx.fillText(caption.readout.slice(0, 110), 40, 1110)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function downloadDataUrl(filename: string, dataUrl: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

export function downloadCaptionText(filename: string, caption: StageCaption) {
  const lines = captionLines(caption)
  const text = `${caption.title}\n\nIntuition: ${lines.intuition}\nFormula: ${lines.formula}\nReadout: ${lines.readout}\nIf you break it: ${lines.caveat}\n`
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not rasterize the stage.'))
    image.src = url
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ')
  let line = ''
  let row = 0
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y + row * lineHeight)
      line = word
      row += 1
      if (row > 1) break
    } else {
      line = next
    }
  }
  if (row <= 1) ctx.fillText(line, x, y + row * lineHeight)
}
