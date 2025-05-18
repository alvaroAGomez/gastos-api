import { categoriaModule } from './Categoria/categoria.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './Usuario/usuario.module';
import { TarjetaCreditoModule } from './TarjetaCredito/tarjeta-credito.module';
import { GastoModule } from './Gasto/gasto.module';
import { AuthModule } from './auth/auth.module';
import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { CuotaModule } from './cuota/cuota.module';
import { BancoModule } from './banco/banco.module';
import { TarjetaDebitoModule } from './TarjetaDebito/tarjeta-debito.module';
import { CustomNamingStrategy } from './common/naming.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production', // no sincronices en prod
        /*         logging: true,
        logger: 'advanced-console', */
        namingStrategy: new CustomNamingStrategy(),
      }),
    }),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    UsersModule,
    TarjetaCreditoModule,
    categoriaModule,
    GastoModule,
    AuthModule,
    CuotaModule,
    BancoModule,
    TarjetaDebitoModule,
  ],
  providers: [],
})
export class AppModule {}
