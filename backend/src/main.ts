import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger/OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Collaborative Publishing Platform API')
    .setDescription(`
      A comprehensive API for a multi-tenant collaborative publishing platform.
      
      ## Features
      - **Multi-tenant Organizations**: Isolated workspaces for different organizations
      - **Role-Based Access Control**: Fine-grained permissions (OWNER, EDITOR, WRITER)
      - **Cross-Organization Permissions**: Controlled sharing between organizations
      - **Advanced Authentication**: JWT-based auth with superadmin capabilities
      - **Post Management**: Create, edit, and publish content
      - **User Management**: Invite, manage, and assign roles to users
      - **Asynchronous Processing**: Queue-based notification system
      
      ## Authentication
      Most endpoints require JWT authentication. Include the token in the Authorization header:
      \`Authorization: Bearer <your-jwt-token>\`
      
      ## Organization Context
      Many endpoints require organization context. The organization ID is typically provided in the URL path.
      
      ## Cross-Organization Access
      Cross-organization operations require explicit permissions granted by organization owners or superadmins.
    `)
    .setVersion('1.0.0')
    // .addTag('auth', 'Authentication and authorization endpoints')
    // .addTag('users', 'User management operations')
    // .addTag('organizations', 'Organization management and membership')
    // .addTag('posts', 'Content creation and management')
    // .addTag('cross-organization', 'Cross-organization permissions and access')
    // .addTag('advanced-auth', 'Advanced authorization and permission checks')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Collaborative Publishing Platform API',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2c3e50; font-size: 2.5em; }
      .swagger-ui .info .description { font-size: 1.1em; line-height: 1.6; }
    `,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
}

bootstrap(); 