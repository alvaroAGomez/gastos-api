import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebitoConfig } from './debito-config.entity';
import { DebitoConfigService } from './debito-config.service';
import { DebitoConfigController } from './debito-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DebitoConfig])],
  providers: [DebitoConfigService],
  controllers: [DebitoConfigController],
  exports: [DebitoConfigService],
})
export class DebitoConfigModule {}
