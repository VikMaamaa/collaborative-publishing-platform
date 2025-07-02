import 'dotenv/config';
import { DataSource } from 'typeorm';
const path = require('path');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'tat2',
  entities: [path.join(__dirname, '/**/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '/migrations/*.{ts,js}')],
  synchronize: false,
  logging: true,
}); 