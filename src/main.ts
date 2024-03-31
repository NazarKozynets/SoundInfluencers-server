import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3001', 'https://music-front-alpha.vercel.app', 'https://go.soundinfluencers.com'], // Разрешенные домены
    methods: 'GET,PUT,POST,DELETE', // Разрешенные HTTP методы
    allowedHeaders: 'Content-Type, Authorization', // Разрешенные заголовки
  });
  const config = new DocumentBuilder()
    .setTitle('Musics example')
    .setDescription('The music API description')
    .setVersion('1.0')
    .addTag('music')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3000);
}
bootstrap();
