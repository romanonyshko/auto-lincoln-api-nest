import { env } from './config/env.js';
import 'reflect-metadata'
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import cookieParser from 'cookie-parser';


const app = await NestFactory.create(AppModule)
app.use(cookieParser())
app.setGlobalPrefix('api');
app.enableCors({
  origin: env.corsOrigin, 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
  credentials: true, 
});
await app.listen(env.port)
