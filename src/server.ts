/**
 * TCP chat server uses Node.js net module
 * delivers messages, executes commands
 *
 * All command functionality is server side,
 * leaving the choice of client up to the user
 */
import { createServer } from 'net';
import { existsSync, readFile, writeFile } from 'fs';
import ora from 'ora';

import * as server_commands from './server_commands.js';

export default function startServer() {
    // create spinner to use for console notifications
    const spinner = ora().start('Setting up server...');

    // create server
    const server = createServer();

    // keep track of sockets
    let counter = 0;
    const sockets = {};
    const MAX_CLIENTS = 3;

    // connection event handler
    server.on('connection', socket => {
        // enforce MAX_CLIENTS
        if (Object.keys(sockets).length + 1 > MAX_CLIENTS) {
            socket.write('Server is full.  Goodbye.');
            socket.destroy();
            return;
        }

        // generate id for socket that connects
        const socketId = counter++;

        // save connected sockets
        sockets[socketId] = socket;

        // greet new client
        socket.setEncoding('utf8');
        socket.write(`Welcome to the server. You are Client ${socketId}.\n`);
        socket.write('Type help for command list.');

        spinner.info(`New Client ${socketId} has connected from ${socket.remoteAddress}:${socket.remotePort}.`);

        // client data handler
        socket.on('data', (data: string) => {
            data = data.trim();

            // split command out
            const command = data.indexOf(' ') === -1 ? data : data.substring(0, data.indexOf(' '));
            data = data.substring(data.indexOf(' ') + 1);

            // execute commands
            switch (command) {
                case 'exit':
                    server_commands.exit(spinner, sockets, socket, socketId);
                    break;
                case 'login':
                    server_commands.login(spinner, sockets, socket, data, logins, socketId);
                    break;
                case 'logout':
                    server_commands.logout(spinner, sockets, socket, socketId);
                    break;
                case 'newuser':
                    server_commands.newuser(spinner, sockets, socket, data, logins, socketId);
                    break;
                case 'send':
                    server_commands.send(spinner, sockets, socket, data, socketId);
                    break;
                case 'who':
                    server_commands.who(spinner, sockets, socket, socketId);
                    break;
                case 'whoami':
                    server_commands.whoami(spinner, socket, socketId);
                    break;
                case 'help':
                    server_commands.help(socket);
                    break;
                default:
                    socket.write('Command not understood.');
                    console.log(`Client ${socketId} sent unrecognized command: "${command} ${data}"`);
                    break;
            }

            return;
        });

        // FIN callback
        socket.on('end', () => {
            delete sockets[socketId];
            spinner.succeed(`Client ${socketId} has disconnected.`);
        });

        // error handler
        socket.on('error', (err: NodeJS.ErrnoException) => {
            switch (err.code) {
                case 'ECONNRESET':
                    spinner.fail(`Client ${socketId} abruptly closed.  The client probably timed out, was overloaded, or rebooted.`);
                    break;
                case 'ERR_STREAM_WRITE_AFTER_END':
                    spinner.fail(`Client ${socketId} error: ${err.message}.`);
                    break;
                default:
                    throw err;
            }
        });
    });

    // server errors
    server.on('error', (err: NodeJS.ErrnoException) => {
        switch (err.code) {
            case 'EADDRINUSE':
                spinner.fail('Local address unavailable. Another server instance is already running.');
                break;
            default:
                spinner.fail(err.message);
                break;
        }
    });

    function loadLogins(data) {
        const logins = {};

        // make sure the file has useable data
        if (data.match(/\w+:\S+/g) === null) {
            return logins;
        }

        // match pattern `username:password\n`
        data.match(/\w+:\S+/g).forEach( m => {
            // split and store in dictionary
            const [key, value] = m.split(':');
            logins[key] = value;
        });

        return logins;
    }

    // open login information

    spinner.start('Opening login information...');
    let logins = {};

    // make sure logins file exists
    if (existsSync('logins.txt')) {
        readFile('logins.txt', 'utf8', (err, data) => {
            if (err) {
                spinner.fail(err.message);
                return;
            }

            logins = loadLogins(data);

            if (Object.keys(logins).length <= 0) {
                spinner.info('No logins to load in file.');
                return;
            }

            spinner.succeed('Logins loaded.');
        });
    } else {
        // create login file
        spinner.info('No login file.');
        spinner.start('Creating login file...');
        writeFile('logins.txt', '', 'utf8', err => {
            if (err) {
                spinner.fail(err.message);
            } else {
                spinner.succeed('Login file created.');
            }
        });
    }

    // listen to port 10119
    server.listen(10119, () => {
        spinner.succeed('Server has started.');
    });
}
