import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import config from '../config';

const modelsPath = path.join(__dirname, '..', 'models');

const initModels = () => {
    fs
        .readdirSync(modelsPath)
        .filter(file => file.endsWith('.js'))
        .forEach(file => require(path.join(modelsPath, file)));
};

export const dbConnect = () => {
    const mongoUser = process.env.MONGO_DB_USER;
    const mongoPassword = process.env.MONGO_DB_PASSWORD;
    const isDocker = process.env.DOCKER;
    const mongoHost: string = isDocker ? config.database.host : 'localhost';
    const dbName: string = config.database.name;
    const mongoUrl = `mongodb://${mongoHost}:27017/${dbName}`;

    const prodOptions = {
        user: mongoUser,
        pass: mongoPassword,
    };

    const options = isDocker ? prodOptions : {};

    mongoose.connect(mongoUrl, options);
    const db = mongoose.connection;
    let retries = 0;

    db.on('error', () => {
        if (retries >= 30) {
            console.error.bind(console, 'connection error:');
        } else {
            console.log('Mongo restoring, expected unsuccessful connection');
        }
        if (db.readyState === 0) {
            setTimeout(() => {
                retries += 1;
                if (db.readyState !== 0) {
                    return;
                }
                mongoose.connect(mongoUrl, options);
            }, 1000);
        }
    });
    db.once('open', () => {
        console.log('mongo instance mounted');
    });

    initModels();

    return db;
};