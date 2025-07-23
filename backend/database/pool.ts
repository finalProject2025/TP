import { Pool, PoolConfig } from 'pg';
import 'dotenv/config';

const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'neighborhelp',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
};

const pool = new Pool(poolConfig);

export default pool; 