import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });
  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(process.env.PORT || 3001);
  console.log(`Relay running on port ${process.env.PORT || 3001}`);
}
bootstrap();