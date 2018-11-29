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

        // EXIT command
        if (data.toString().startsWith("exit")) {
            spinner.info(`Client ${socket.id} sent exit command.`);
            Object.entries(sockets).forEach(([keys, sc]) => {
                if (socket.hasOwnProperty('uname')) {
                    sc.write(`${socket.uname} has logged out.  `);
                }
                sc.write(`Client ${socket.id} disconnected from room.`);
            });
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
                spinner.info(`User "${socket.uname}" attempted relogin with "${username}".`);
                return;
            }

            if (!username || !password) {
                socket.write("You cannot login with empty information.");
                spinner.info(`Client ${socket.id} sent empty login command.`);
                return;
            }

            if (!logins.hasOwnProperty(username)) {
                socket.write("Username or password incorrect.");
                spinner.warn(`${username} was provided as incorrect username on Client ${socket.id}.`);
                return;
            }

            if (logins[username].localeCompare(password) !== 0) {
                socket.write("username or Password incorrect.");
                spinner.warn(`Failed login attempt from ${username} on Client ${socket.id}.`);
                return;
            }

            // login user
            socket.uname = username;

            // notify of login
            spinner.succeed(`Logged in user ${socket.uname.toString()} on Client ${socket.id}`);
            Object.entries(sockets).forEach(([keys, sc]) => {
                sc.write(`${socket.uname} has logged in.`);
            });

            return;
        }

        // LOGOUT command
        if (data.toString().startsWith("logout")) {
            if (!socket.hasOwnProperty('uname')) {
                spinner.info(`Failed logout command from Client ${socket.id}`);
                return;
            }

            Object.entries(sockets).forEach(([keys, sc]) => {
                sc.write(`${socket.uname} has logged out.`);
            });

            spinner.succeed(`${socket.uname} logged out from Client ${socket.id}`);
            delete socket.uname;

            socket.end();

            return;
        }

        // NEWUSER command
        if (data.toString().startsWith("newuser ")) {
            const str = data.toString().substring(8);
            const username = str.substring(0, str.indexOf(' '));
            const password = str.substring(str.indexOf(' ') + 1);

            if (!username || !password) {
                socket.write("Newuser failed.");
                spinner.info(`Incorrect newuser command from Client ${socket.id}`);
                return;
            }

            if (socket.hasOwnProperty('uname')) {
                socket.write("Already logged in.");
                spinner.info(`User "${socket.uname}" attempted newuser.`);
                return;
            }

            if (username.length >= 32) {
                socket.write("UserID is too long.");
                spinner.info(`Client ${socket.id} failed newuser with username ${username}`);
                return;
            }

            if (password.length < 4 || password.length > 8) {
                socket.write("password length must be between 4 and 8 characters.");
                spinner.info(`Client ${socket.id} failed newuser with bad password.`);
                return;
            }

            // save to logins.txt
            fs.appendFile('logins.txt', `${username}:${password}`, 'utf8', err => {
                if (err) throw err;
                spinner.succeed(`${username} appended to logins.txt`);
            });

            // login in user
            socket.uname = username;

            // notify of new user and login
            spinner.succeed(`Created and logged in user ${socket.uname.toString()} on client ${socket.id}`);
            Object.entries(sockets).forEach(([keys, sc]) => {
                sc.write(`${socket.uname} has logged in with a new account.`);
            });

            return;
        }


        // SEND command
        if (data.toString().startsWith("send ")) {
            const str = data.toString().substring(5);

            // isolate intended recipient and message
            const intended = str.substring(0, str.indexOf(' '));
            const message = str.substring(str.indexOf(' '));

            // check for login
            if (!socket.hasOwnProperty('uname')) {
                socket.write("Denied.  Please log in first.\n");
                spinner.warn(`${socket.id} attempted to send "${message}" to ${intended} without login.`);
                return;
            }

            // ALL
            if (intended.localeCompare('all') === 0) {
                // broacast message to all logged in users
                Object.entries(sockets).forEach( ([key, sc]) => {
                    //if (key != socket.id) {
                    if (sc.hasOwnProperty('uname')) {
                        sc.write(`${socket.uname}: ${message}`);
                    }
                });
                console.log(`${socket.uname} (to all): ${message}`);
                return;
            }

            // find intended and write message to them
            Object.entries(sockets).forEach( ([key, sc]) => {
                if (intended.localeCompare(sc.uname) === 0) {
                    sc.write(`${socket.uname} (to you): ${message} `);
                    socket.write(`${socket.uname} (to ${sc.uname}): ${message}`);
                    console.log(`${socket.uname} (to ${sc.uname}): ${message}`);
                }
            });
            return;
        }

        // WHO command
        if (data.toString().startsWith("who")) {
            spinner.info(`Client ${socket.id} sent who command.`);

            let loggedInUsers = 0;
            Object.entries(sockets).forEach( ([key, sc]) => {
                if (sc.hasOwnProperty('uname')) {
                    socket.write(`${sc.uname}\t\tClient ${sc.id}\t${sc.remoteAddress}:${sc.remotePort}\n`);
                    loggedInUsers++;
                }
            });
            socket.write(`${loggedInUsers} logged in users.`);
            return;
        }

        // HELP command
        if (data.toString().startsWith("help")) {
            socket.write(`
                    Command list:
                    help - this message
                    login [UserID] [Password] - log in to chatroom
                    newuser [UserID] [Password] - create new user and log in
                    send [all|UserID] [message] - send a message to all or a specific user
                    who - list logged in users
                    logout - leave chat room
                    exit - end client connection to server
                    `);
            return;
        }

        socket.write("Command not understood.");
        console.log(`Client ${socket.id} sent wrong command: "${data}"`);
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
