/**
 * server functionality to handle client data
 */
'use strict';

const fs = require('fs');           // filesystem
const bcrypt = require('bcrypt');   // encryption library

// client request disconnect
exports.exit = (spinner, sockets, socket) => {
    spinner.info(`Client ${socket.id} sent exit command.`);
    Object.entries(sockets).forEach(([keys, sc]) => {
        if (socket.hasOwnProperty('uname')) {
            sc.write(`${socket.uname} logged out.  `);
        }
        sc.write(`Client ${socket.id} disconnected from room.`);
    });
    socket.end();
    return;
};

// validate and do client login
exports.login = (spinner, sockets, socket, data, logins) => {
    const args = data.split(' ');
    const username = args[0];
    const password = args[1];

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

    if (!bcrypt.compareSync(password, logins[username])) {
        socket.write("username or Password incorrect.");
        spinner.warn(`Failed login attempt to ${username} on Client ${socket.id}.`);
        return;
    }

    // login user
    socket.uname = username;

    // notify of login
    spinner.succeed(`Logged in user ${socket.uname.toString()} on Client ${socket.id}`);
    Object.entries(sockets).forEach(([keys, sc]) => {
        sc.write(`${socket.uname} logged in.`);
    });

    return;

};

// client request logout
exports.logout = (spinner, sockets, socket) => {
    if (!socket.hasOwnProperty('uname')) {
        socket.write("You are not logged in. ");
        spinner.info(`Failed logout command from Client ${socket.id}.`);
        return;
    }

    Object.entries(sockets).forEach(([keys, sc]) => {
        sc.write(`${socket.uname} logged out.`);
    });

    spinner.succeed(`${socket.uname} logged out from Client ${socket.id}`);
    delete socket.uname;

    //socket.end();

    return;
};

// client creates new user and login
exports.newuser = (spinner, sockets, socket, data, logins) => {
    const args = data.split(' ');
    const username = args[0];
    let password = args[1];

    if (!username || !password) {
        socket.write("You cannot create a new user with empty information.");
        spinner.info(`Client ${socket.id} sent empty newuser command.`);
        return;
    }

    if (socket.hasOwnProperty('uname')) {
        socket.write("Already logged in.");
        spinner.info(`User "${socket.uname}" attempted newuser.`);
        return;
    }

    if (username.length >= 32) {
        socket.write("UserID is too long.");
        spinner.info(`Client ${socket.id} failed newuser with long username ${username.substr(0,32)}...`);
        return;
    }

    // password policy
    const minLength = 8;
    const maxLength = 64;
    if (password.length < minLength || password.length > maxLength) {
        socket.write(`Password length must be between ${minLength} and ${maxLength} characters.`);
        spinner.info(`Client ${socket.id} failed newuser with out-of-range password.`);
        return;
    }

    // hash password
    password = bcrypt.hashSync(password, 10);

    // save to logins.txt
    fs.appendFile('logins.txt', `${username}:${password}`, 'utf8', err => {
        if (err) {
            spinner.fail(err.message);
            socket.write("Error saving login.  Please contact server admin.");
            return;
        } else {
            // add to loaded login data
            logins[username] = password;

            spinner.succeed(`${username} appended to logins.txt`);
        }
    });

    // login in user
    socket.uname = username;

    // notify of new user and login
    spinner.succeed(`Created and logged in user ${socket.uname.toString()} on client ${socket.id}`);
    Object.entries(sockets).forEach(([keys, sc]) => {
        sc.write(`${socket.uname} logged in with a new account.`);
    });

    return;
};

// send message to all or a specific user
exports.send = (spinner, sockets, socket, data) => {
    // isolate intended recipient and message
    const intended = data.substring(0, data.indexOf(' '));
    const message = data.substring(data.indexOf(' ') + 1);

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
    let found = false;
    if (intended.localeCompare(socket.uname) === 0) {
        socket.write(`Message from yourself: ${message}`);
        console.log(`${socket.uname} (to themself): ${message}`);
        return;
    } else {
        Object.entries(sockets).forEach( ([key, sc]) => {
            if (intended.localeCompare(sc.uname) === 0) {
                sc.write(`${socket.uname} (to you): ${message} `);
                socket.write(`${socket.uname} (to ${sc.uname}): ${message}`);
                console.log(`${socket.uname} (to ${sc.uname}): ${message}`);
                found = true;
            }
        });
    }
    if (!found) {
        socket.write(`${intended} is not on this server. `);
        spinner.info(`${socket.uname} failed to send message to "${intended}".`);
    }
    return;
};

// display all logged in users
exports.who = (spinner, sockets, socket) => {
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
};

// display client id or logged in username
exports.whoami = (spinner, socket) => {
    spinner.info(`Client ${socket.id} sent whoami command.`);

    if (socket.hasOwnProperty('uname')) {
        socket.write(socket.uname);
    } else {
        socket.write(`Client ${socket.id}`);
    }

    return;
};

// help list of commands
exports.help = (socket) => {
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
};
