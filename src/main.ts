import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  app.enableCors({
    origin: true, // o true para cualquier origen (solo en dev)
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  app.enableShutdownHooks();

  // 👉 Configuración de Swagger con tags ordenados
  const config = new DocumentBuilder()
    .setTitle('Gastos API')
    .setDescription('Documentación de la API de gastos')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Banco')
    .addTag('Categoria Gastos')
    .addTag('Cuota')
    .addTag('Gastos')
    .addTag('Tarjeta Crédito')
    .addTag('Tarjeta Débito')
    //.addTag('Usuario')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/', app, document);

  await app.listen(port);
  console.log(`🚀 App corriendo en http://localhost:${port}`);
}
bootstrap();
