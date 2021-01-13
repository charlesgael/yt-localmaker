import configuration from '@feathersjs/configuration';
import express from '@feathersjs/express';
import feathers from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio';
import compress from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import favicon from 'serve-favicon';
import appHooks from './app.hooks';
import authentication from './authentication';
import bootstrap from './bootstrap';
import channels from './channels';
import { Application } from './declarations';
import middleware from './middleware';
import sequelize from './sequelize';
import services from './services';
import logger from './util/logger';

// process.on('uncaughtException', (error) =>
//     logger.error(
//         `Uncaught Exception: ${error.name}\n${error.message}\n${(error.stack || '').replace(
//             '\\n',
//             '\n'
//         )}`
//     )
// );
// process.on('unhandledRejection', (error) => {
//     if (error)
//         logger.error(`Unhandled Rejection: \n${((error as any).stack || '').replace('\\n', '\n')}`);
//     else logger.error('Unhandled Rejection');
// });

dotenv.config();

const app: Application = express(feathers());

// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')));

// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio());

app.configure(sequelize);

// Configure other middleware (see `middleware/index.ts`)
app.configure(middleware);
app.configure(authentication);
// Set up our services (see `services/index.ts`)
app.configure(services);
// Set up event channels (see channels.ts)
app.configure(channels);

app.configure(bootstrap);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger } as any));

app.hooks(appHooks);

export default app;
