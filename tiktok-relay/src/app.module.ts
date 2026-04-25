import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TerminalGateway } from './terminal/terminal.gateway';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // biar bisa dipakai di semua file
    }),
  ],
  controllers: [AppController],
  providers: [AppService, TerminalGateway],
})
export class AppModule {}
