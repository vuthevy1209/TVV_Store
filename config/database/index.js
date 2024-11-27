import { Sequelize } from '@sequelize/core';
import { PostgresDialect } from '@sequelize/postgres';

const sequelize = new Sequelize({
    dialect: PostgresDialect,
    database: 'tvv_store',
    user: 'tvv_store_user',
    password: 'lAp4dkFJwdcKakkqJYjTKo1qLtAvYtxX',
    host: 'dpg-ct3a0odumphs73dqa3ng-a.oregon-postgres.render.com',
    port: 5432,
    ssl: true,
    clientMinMessages: 'notice',
});

async function connect() {
    try {
        await sequelize.authenticate();
        console.log('Connect to database successfully.');
    } catch (error) {
        console.error('Connect failure!!!', error);
    }
}

export { sequelize, connect };