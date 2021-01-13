import dayjs from 'dayjs';
import { createLogger, format, LoggerOptions, transports } from 'winston';

const { combine, timestamp, cli, errors, json, splat, printf } = format;

const devConfig = (): LoggerOptions => {
    const purify = (rest: Record<string, any>) => {
        if (Object.keys(rest).length) {
            return '\n' + JSON.stringify(typeof rest.toJSON === 'function' ? rest.toJSON() : rest, null, 2);
            // .filter(([key], idx, obj) => obj.hasOwnProperty(key))
        }
        return '';
    };

    const symbols = [Symbol.for('splat'), Symbol.for('message'), Symbol.for('level')];

    const myFormat = printf(({ level, message, timestamp, metadata, ...rest }) => {
        (symbols as any[]).forEach((it) => delete rest[it]);

        return `${dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')}  [${level}]${message}${purify(rest)}`;
    });

    return {
        level: 'debug',
        format: combine(splat(), timestamp(), errors({ stack: true }), cli(), myFormat),
        transports: [new transports.Console()],
    };
};

const prodConfig = (): LoggerOptions => {
    const common = {
        zippedArchive: true,
        maxsize: 20 * 1024 * 1024,
        maxFiles: 10,
        tailable: true,
    };

    return {
        level: 'info',
        format: combine(splat(), timestamp(), errors(), json()),
        transports: [
            new transports.File({
                ...common,
                filename: 'logs/application.log',
                handleExceptions: true,
            }),
            new transports.File({
                ...common,
                filename: 'logs/errors.log',
                level: 'error',
            }),
        ],
        exceptionHandlers: [
            new transports.File({
                ...common,
                filename: 'logs/exceptions.log',
            }),
        ],
    };
};

// Configure the Winston logger. For the complete documentation see https://github.com/winstonjs/winston
export const logger = createLogger(
    process.env.NODE_ENV === 'production' // Logger config env dependent
        ? prodConfig()
        : devConfig()
);

export default logger;
