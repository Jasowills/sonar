import 'dotenv/config'
import express from 'express'
import { NestFactory } from '@nestjs/core'
import { ExpressAdapter } from '@nestjs/platform-express'
import { AppModule } from '../src/app.module'
import { ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'

const expressApp = express()

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { bodyParser: false },
  )

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))
  app.use(express.json({ limit: '10mb' }))

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'http://localhost:3001']
  app.enableCors({ origin: allowedOrigins, credentials: true })

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )

  await app.init()
  return app.getHttpAdapter().getInstance()
}

let cachedApp: express.Express

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await bootstrap()
  }
  return cachedApp(req, res)
}
