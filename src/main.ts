import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setViewEngine('ejs');
  app.useGlobalPipes(new ValidationPipe());
  app.setBaseViewsDir('src/modules/mail/templates');
  app.use(
    '/swagger-ui',
    express.static(join(__dirname, '..', 'node_modules/swagger-ui-dist')),
  );
  app.enableCors();

  const swagger = new DocumentBuilder()
    .setTitle('Collabry API')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .build();
  const documentation = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('swagger', app, documentation, {
    customJs: '/swagger-ui/swagger-ui-bundle.js',
    customCssUrl: '/swagger-ui/swagger-ui.css',
    customSiteTitle: 'Collabry API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  await app.listen(4000);
}
bootstrap();
