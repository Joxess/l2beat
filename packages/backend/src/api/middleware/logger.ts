import { Logger } from '@l2beat/common'
import { Context, Middleware, Next } from 'koa'

export function createApiLogger(logger: Logger): Middleware {
  return async function (ctx: Context, next: Next): Promise<void> {
    const key = Symbol.for('request-received.startTime')
    // eslint-disable-next-line
    const start: number = ctx[key as any]?.getTime?.() ?? Date.now()

    logger.info({ type: 'request', method: ctx.method, url: ctx.originalUrl })

    try {
      await next()
    } catch (error) {
      logger.error(error)
      throw error
    }

    const { res } = ctx

    const done = () => {
      res.removeListener('finish', done)
      res.removeListener('close', done)

      const timeMs = Date.now() - start

      logger.info({
        type: 'response',
        status: ctx.status,
        timeMs,
        method: ctx.method,
        url: ctx.originalUrl,
      })
    }

    res.once('finish', done)
    res.once('close', done)
  }
}
