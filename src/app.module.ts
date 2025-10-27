import { CategoriaModule } from './Categoria/categoria.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './Usuario/usuario.module';
import { TarjetaCreditoModule } from './TarjetaCredito/tarjeta-credito.module';
import { GastoModule } from './Gasto/gasto.module';
import { AuthModule } from './Auth/auth.module';
import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { CuotaModule } from './Cuota/cuota.module';
import { BancoModule } from './Banco/banco.module';
import { DebitoConfigModule } from './DebitoConfig/debito-config.module';
import { CustomNamingStrategy } from './common/naming.strategy';
import { EstadosModule } from './EstadoCuenta/estado-cuenta.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardModule } from './Dashboard/dashboard.module';

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
        synchronize: false, // Usar migraciones en lugar de synchronize
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
    CategoriaModule,
    GastoModule,
    AuthModule,
    CuotaModule,
    BancoModule,
    DebitoConfigModule,
    EstadosModule,
    ScheduleModule.forRoot(),
    DashboardModule,
  ],
  providers: [],
})
export class AppModule {}
