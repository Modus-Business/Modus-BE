import { DataSource } from 'typeorm';
import { createDataSourceOptions } from './src/database/typeorm.config';

process.loadEnvFile?.();

export default new DataSource(createDataSourceOptions(process.env));
