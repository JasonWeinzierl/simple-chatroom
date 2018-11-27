/**
 * TCP chat server uses Node.js net module
 * delivers messages, executes commands
 */
'use strict';

const net = require('net');
const fs = require('fs');
const ora = require('ora');

const spinner = ora().start("Setting up server...");
const server = net.createServer();

// keep track of sockets
let counter = 0;
const sockets = {};

// connection event handler
server.on('connection', socket => {
    // assign id to socket that connects
    socket.id = counter++;
    console.log(`client ${socket.id} has connected from ${socket.remoteAddress}:${socket.remotePort}`);

    // save connected sockets
    sockets[socket.id] = socket;

    // greet new client
    socket.setEncoding('utf8');
    socket.write("Welcome to the server.\n");


    // client data
    socket.on('data', data => {
        console.log(`Client ${socket.id} data: ${data}`);

        // EXIT command
        if (data.toString().startsWith("exit")) {
            console.log(`exit command received: ${socket.remoteAddress}:${socket.remotePort}`);
            if (socket.hasOwnProperty('uname')) {
                Object.entries(sockets).forEach(([keys, sc]) => {
                    sc.write(`${socket.uname} has disconnected.`);
                });
            }
            socket.end();
            return;
        }

        // LOGIN command
        if (data.toString().startsWith("login ")) {
            const str = data.toString().substring(6);
            const username = str.substring(0, str.indexOf(' '));
            const password = str.substring(str.indexOf(' ') + 1);

            if (socket.hasOwnProperty('uname')) {
                socket.write("Already logged in.");
                return;
            }

            if (!username || !password) {
                socket.write("You cannot login with empty information.");
                return;
            }

            if (!logins.hasOwnProperty(username)) {
                socket.write("Username or password incorrect.");
                console.log(username + " was provided as incorrect username.");
                return;
            }

            if (logins[username].localeCompare(password)) {
                socket.write("username or Password incorrect.");
                console.log(`Failed login attempt from ${username}.`);
                return;
            }

            socket.uname = username;

            console.log(`Logged in user ${socket.uname.toString()} on client ${socket.id}`);
            Object.entries(sockets).forEach(([keys, sc]) => {
                sc.write(`${socket.uname} has joined.`);
            });

            return;
        }

        // LOGOUT command
        if (data.toString().startsWith("logout")) {
            if (!socket.hasOwnProperty('uname')) {
                return;
            }

            Object.entries(sockets).forEach(([keys, sc]) => {
                sc.write(`${socket.uname} has disconnected.`);
            });
            delete socket.uname;
            return;
        }

        // NEWUSER command
        if (data.toString().startsWith("newuser ")) {
            const str = data.toString().substring(8);
            const username = str.substring(0, str.indexOf(' '));
            const password = str.substring(str.indexOf(' ') + 1);

            if (!username || !password) {
                socket.write("Newuser failed.");
                return;
            }

            if (socket.hasOwnProperty('uname')) {
                socket.write("Already logged in.");
                return;
            }

            socket.uname = username;
            console.log(`Created and logged in user ${socket.uname.toString()} on client ${socket.id}`);
            Object.entries(sockets).forEach(([keys, sc]) => {
                sc.write(`${socket.uname} has joined with a new account.`);
            });

            return;
        }


        // SEND command
        if (data.toString().startsWith("send ")) {
            const message = data.toString().substring(5);

            if (!socket.hasOwnProperty('uname')) {
                socket.write("Denied.  Please log in first.\n");
                console.log(`${socket.id} attempted to send "${message}" without login.`);
                return;
            }

            // broacast message to all saved clients
            Object.entries(sockets).forEach( ([key, sc]) => {
                //if (key != socket.id) {
                    sc.write(`${socket.uname}: ${message}`);
                //}
            });
            return;
        }
    });

    // client FIN callback
    socket.on('end', () => {
        delete sockets[socket.id];
        console.log(`Client ${socket.id} has disconnected`);
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
fs.readFile('logins.txt', 'utf8', (err, data) => {
    if (err) throw err;

    // match pattern `username:password\n`
    data.match(/\w+:\w+/g).forEach( m => {
        // split and store in dictionary
        let [key, value] = m.split(':');
        logins[key] = value;
    });

    spinner.succeed("Logins loaded.");
});

// listen to port 10119
server.listen(10119, () => {
    spinner.succeed("Server has started.");
});
