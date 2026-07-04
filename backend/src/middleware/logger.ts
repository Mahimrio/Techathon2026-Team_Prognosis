import type { Request, Response, NextFunction } from 'express'

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now()
  res.on('finish', () => {
    console.log(`[${req.method}] ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`)
  })
  next()
}
