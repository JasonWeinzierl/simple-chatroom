/**
 * TCP chat server uses Node.js net module
 * delivers messages, executes commands
 *
 * All command functionality is server side,
 * leaving the choice of client up to the user
 */
'use strict';

const net = require('net');
const fs = require('fs');
const ora = require('ora');

const server_commands = require('./server_commands');

// create spinner to use for console notifications
const spinner = ora().start("Setting up server...");

// create server
const server = net.createServer();

// keep track of sockets
let counter = 0;
const sockets = {};
const MAXCLIENTS = 3;

// connection event handler
server.on('connection', socket => {
    // MAXCLIENTS
    if (Object.keys(sockets).length + 1 > MAXCLIENTS) {
        socket.write("Server is full.  Goodbye.");
        socket.destroy();
        return;
    }

    // assign id to socket that connects
    socket.id = counter++;

    // save connected sockets
    sockets[socket.id] = socket;

    // greet new client
    socket.setEncoding('utf8');
    socket.write(`Welcome to the server. You are Client ${socket.id}.\n`);
    socket.write("Type help for command list.");

    spinner.info(`New Client ${socket.id} has connected from ${socket.remoteAddress}:${socket.remotePort}.`);

    // client data
    socket.on('data', data => {

        // split command out
        if (data.indexOf(' ') === -1) data = `${data} `;
        const command = data.substring(0, data.indexOf(' '));
        data = data.substring(data.indexOf(' ') + 1);

        switch (command) {
            case "exit":
                server_commands.exit(spinner, sockets, socket);
                break;
            case "login":
                server_commands.login(spinner, sockets, socket, data, logins);
                break;
            case "logout":
                server_commands.logout(spinner, sockets, socket);
                break;
            case "newuser":
                server_commands.newuser(spinner, sockets, socket, data, logins);
                break;
            case "send":
                server_commands.send(spinner, sockets, socket, data);
                break;
            case "who":
                server_commands.who(spinner, sockets, socket);
                break;
            case "help":
                server_commands.help(socket);
                break;
            default:
                socket.write("Command not understood.");
                console.log(`Client ${socket.id} sent wrong command: "${data}"`);
                break;
        }

        return;
    });

    // FIN callback
    socket.on('end', () => {
        delete sockets[socket.id];
        spinner.succeed(`Client ${socket.id} has disconnected.`);
    });

    // error
    socket.on('error', err => {
        switch (err.code) {
            case 'ECONNRESET':
                spinner.fail(`Client ${socket.id} abruptly closed.  The client probably timed out or rebooted.`);
                break;
            default:
                throw err;
        }
    });
});

// server errors
server.on('error', err => {
    switch (err.code) {
        case 'EADDRINUSE':
            spinner.fail(`Local address unavailable. Another server instance is already running.`);
            break;
        default:
            spinner.fail(err.message);
            break;
    }
});

// open login information

spinner.start("Opening login information...");
const logins = {};

// make sure logins file exists
if (fs.existsSync('logins.txt')) {
    fs.readFile('logins.txt', 'utf8', (err, data) => {
        if (err) {
            spinner.fail(err.message);
            return;
        }

        // make sure the file has useable data
        if (data.match(/\w+:\w+/g) === null) {
            spinner.info("No logins to load in file.");
            return;
        }
        // match pattern `username:password\n`
        data.match(/\w+:\w+/g).forEach( m => {
            // split and store in dictionary
            let [key, value] = m.split(':');
            logins[key] = value;
        });

        spinner.succeed("Logins loaded.");
    });
} else {
    // create login file
    spinner.info("No login file.");
    spinner.start("Creating login file...");
    fs.writeFile('logins.txt', '', 'utf8', err => {
        if (err) {
            spinner.fail(err.message);
        } else {
            spinner.succeed("Login file created.");
        }
    });
}

// listen to port 10119
server.listen(10119, () => {
    spinner.succeed("Server has started.");
});
