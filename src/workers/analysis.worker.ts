import { detectSchema } from '../lib/schema'

type RequestMessage = {
  id: string
  type: 'detect-schema'
  rows: Record<string, unknown>[]
}

self.onmessage = (event: MessageEvent<RequestMessage>) => {
  if (event.data.type === 'detect-schema') {
    const schema = detectSchema(event.data.rows)
    self.postMessage({ id: event.data.id, schema })
  }
}

