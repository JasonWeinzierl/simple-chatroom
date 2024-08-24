/**
 * TCP chat server uses Node.js net module
 * delivers messages, executes commands
 *
 * All command functionality is server side,
 * leaving the choice of client up to the user
 */
import { existsSync, readFile, writeFile } from 'fs';
import { createServer } from 'net';
import ora from 'ora';

import * as serverCommands from './serverCommands.js';

export default function startServer(): void {
    // create spinner to use for console notifications
    const spinner = ora().start('Setting up server...');

    // create server
    const server = createServer();

    // keep track of sockets
    let counter = 0;
    const clients: serverCommands.ChatClient[] = [];
    const MAX_CLIENTS = 3;

    // connection event handler
    server.on('connection', socket => {
        // enforce MAX_CLIENTS
        if (clients.length + 1 > MAX_CLIENTS) {
            socket.write('Server is full.  Goodbye.');
            socket.destroy();
            return;
        }

        // generate id for socket that connects
        const socketId = counter++;

        // save connected sockets
        const client = {
            id: socketId,
            socket,
        };
        clients.push(client);

        // greet new client
        socket.setEncoding('utf8');
        socket.write(`Welcome to the server. You are Client ${socketId}.\n`);
        socket.write('Type help for command list.');

        spinner.info(`New Client ${socketId} has connected from ${socket.remoteAddress}:${socket.remotePort}.`);

        // client data handler
        socket.on('data', (data: string) => {
            const trimmedData = data.trim();

            // split command out
            const command = !trimmedData.includes(' ') ? trimmedData : trimmedData.substring(0, trimmedData.indexOf(' '));
            const args = trimmedData.substring(trimmedData.indexOf(' ') + 1);

            // execute commands
            switch (command) {
                case 'exit':
                    serverCommands.exit(spinner, clients, client);
                    break;
                case 'login':
                    serverCommands.login(spinner, clients, client, args, logins);
                    break;
                case 'logout':
                    serverCommands.logout(spinner, clients, client);
                    break;
                case 'newuser':
                    serverCommands.newuser(spinner, clients, client, args, logins);
                    break;
                case 'send':
                    serverCommands.send(spinner, clients, client, args);
                    break;
                case 'who':
                    serverCommands.who(spinner, clients, client);
                    break;
                case 'whoami':
                    serverCommands.whoami(spinner, client);
                    break;
                case 'help':
                    serverCommands.help(client);
                    break;
                default:
                    socket.write('Command not understood.');
                    console.log(`Client ${socketId} sent unrecognized command: "${command} ${args}"`);
                    break;
            }

            return;
        });

        // FIN callback
        socket.on('end', () => {
            const index = clients.findIndex(item => item.id === socketId);
            if (index >= 0) {
                clients.splice(index, 1);
            }
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

    function loadLogins(data: string): Record<string, string> {
        const logins: Record<string, string> = {};

        // match pattern `username:password\n`
        const parsed = data.match(/\w+:\S+/g);

        // make sure the file has useable data
        if (!parsed) {
            return logins;
        }

        parsed.forEach(m => {
            // split and store in dictionary
            const [key, value] = m.split(':') as [string, string];
            logins[key] = value;
        });

        return logins;
    }

    // open login information

    spinner.start('Opening login information...');
    let logins: Record<string, string> = {};

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
