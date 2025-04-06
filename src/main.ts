import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remueve propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // lanza error si viene algo no permitido
      transform: true, // convierte los payloads al tipo definido (ej. string a number)
    })
  );

  // 👉 Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Gastos API')
    .setDescription('Documentación de la API de gastos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/', app, document); // Documentación en http://localhost:3000/api/

  await app.listen(port);
  console.log(`🚀 App corriendo en http://localhost:${port}`);
}
bootstrap();
