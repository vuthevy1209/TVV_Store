// import { Sequelize } from '@sequelize/core';
// import { PostgresDialect } from '@sequelize/postgres';

const { Sequelize } = require('@sequelize/core');
const { PostgresDialect } = require('@sequelize/postgres');


const sequelize = new Sequelize({
    dialect: PostgresDialect,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    ssl: process.env.DATABASE_SSL === 'true',
    clientMinMessages: 'notice',
});

async function connect() {
    try {
        await sequelize.authenticate();
        console.log('Connect to posgre successfully.');
        await sequelize.sync({ force: false, alter: false});
        console.log('Posgre synchronized successfully.');
    } catch (error) {
        console.error('Connect to posgre failure!!!', error);
    }
}

module.exports =  { sequelize, connect };