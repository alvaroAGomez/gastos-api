import { categoryModule } from './Categorys/categorys.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { CardsModule } from './cards/cards.module';
import { CardsService } from './Cards/cards.service';
import { ExpensesModule } from './expenses/expenses.module';
import { AuthModule } from './auth/auth.module';
import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';

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
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production', // no sincronices en prod
      }),
    }),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    UsersModule,
    CardsModule,
    categoryModule,
    ExpensesModule,
    AuthModule,
  ],
  providers: [CardsService],
})
export class AppModule {}
