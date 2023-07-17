/**
 * server functionality to handle client data
 */
import { appendFile } from 'fs';
import { compareSync, hashSync } from 'bcrypt';

// client request disconnect
export function exit(spinner, sockets, socket, socketId: number) {
    spinner.info(`Client ${socketId} sent exit command.`);
    for (const id in sockets) {
        const sc = sockets[id];
        if (Object.hasOwn(socket, 'uname')) {
            sc.write(`${socket.uname} logged out.  `);
        }
        sc.write(`Client ${socketId} disconnected from room.`);
    }
    socket.end();
    return;
}

// validate and do client login
export function login(spinner, sockets, socket, data, logins, socketId: number) {
    const args = data.split(' ');
    const username = args[0];
    const password = args[1];

    if (Object.hasOwn(socket, 'uname')) {
        socket.write('Already logged in.');
        spinner.info(`User "${socket.uname}" attempted relogin with "${username}".`);
        return;
    }

    if (!username || !password) {
        socket.write('You cannot login with empty information.');
        spinner.info(`Client ${socketId} sent empty login command.`);
        return;
    }

    if (!Object.hasOwn(logins, username)) {
        socket.write('Username or password incorrect.');
        spinner.warn(`${username} was provided as incorrect username on Client ${socketId}.`);
        return;
    }

    if (!compareSync(password, logins[username])) {
        socket.write('username or Password incorrect.');
        spinner.warn(`Failed login attempt to ${username} on Client ${socketId}.`);
        return;
    }

    // login user
    socket.uname = username;

    // notify of login
    spinner.succeed(`Logged in user ${socket.uname.toString()} on Client ${socketId}`);
    for (const id in sockets) {
        const sc = sockets[id];
        sc.write(`${socket.uname} logged in.`);
    }

    return;

}

// client request logout
export function logout(spinner, sockets, socket, socketId: number) {
    if (!Object.hasOwn(socket, 'uname')) {
        socket.write('You are not logged in. ');
        spinner.info(`Failed logout command from Client ${socketId}.`);
        return;
    }

    for (const id in sockets) {
        const sc = sockets[id];
        sc.write(`${socket.uname} logged out.`);
    }

    spinner.succeed(`${socket.uname} logged out from Client ${socketId}`);
    delete socket.uname;

    //socket.end();

    return;
}

// client creates new user and login
export function newuser(spinner, sockets, socket, data, logins, socketId: number) {
    const args = data.split(' ');
    const username = args[0];
    let password = args[1];

    if (!username || !password) {
        socket.write('You cannot create a new user with empty information.');
        spinner.info(`Client ${socketId} sent empty newuser command.`);
        return;
    }

    if (Object.hasOwn(socket, 'uname')) {
        socket.write('Already logged in.');
        spinner.info(`User "${socket.uname}" attempted newuser.`);
        return;
    }

    if (username.length >= 32) {
        socket.write('UserID is too long.');
        spinner.info(`Client ${socketId} failed newuser with long username ${username.substr(0,32)}...`);
        return;
    }

    // password policy
    const minLength = 8;
    const maxLength = 64;
    if (password.length < minLength || password.length > maxLength) {
        socket.write(`Password length must be between ${minLength} and ${maxLength} characters.`);
        spinner.info(`Client ${socketId} failed newuser with out-of-range password.`);
        return;
    }

    // hash password
    password = hashSync(password, 10);

    // save to logins.txt
    appendFile('logins.txt', `${username}:${password}\n`, 'utf8', err => {
        if (err) {
            spinner.fail(err.message);
            socket.write('Error saving login.  Please contact server admin.');
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
    spinner.succeed(`Created and logged in user ${socket.uname.toString()} on Client ${socketId}`);
    for (const id in sockets) {
        const sc = sockets[id];
        sc.write(`${socket.uname} logged in with a new account.`);
    }

    return;
}

// send message to all or a specific user
export function send(spinner, sockets, socket, data, socketId: number) {
    // isolate intended recipient and message
    const intended = data.indexOf(' ') === -1 ? data : data.substring(0, data.indexOf(' '));
    const message = data.indexOf(' ') === -1 ? '' : data.substring(data.indexOf(' ') + 1);

    // check for login
    if (!Object.hasOwn(socket, 'uname')) {
        socket.write('Denied.  Please log in first.\n');
        spinner.warn(`Client ${socketId} attempted to send "${message}" to ${intended} without login.`);
        return;
    }

    // check empty message
    if (!message) {
        socket.write('Cannot send empty message.\n');
        spinner.warn(`${socket.uname} tried to send empty message to ${intended}.`);
        return;
    }

    // ALL
    if (intended.localeCompare('all') === 0) {
        // broadcast message to all logged in users
        for (const id in sockets) {
            const sc = sockets[id];
            //if (id != socketId) {
            if (Object.hasOwn(sc, 'uname')) {
                sc.write(`${socket.uname}: ${message}`);
            }
        }
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
        for (const id in sockets) {
            const sc = sockets[id];
            if (intended.localeCompare(sc.uname) === 0) {
                sc.write(`${socket.uname} (to you): ${message} `);
                socket.write(`${socket.uname} (to ${sc.uname}): ${message}`);
                console.log(`${socket.uname} (to ${sc.uname}): ${message}`);
                found = true;
            }
        }
    }
    if (!found) {
        socket.write(`${intended} is not on this server. `);
        spinner.info(`${socket.uname} failed to send message to "${intended}".`);
    }
    return;
}

// display all logged in users
export function who(spinner, sockets, socket, socketId: number) {
    spinner.info(`Client ${socketId} sent who command.`);

    let loggedInUsers = 0;
    for (const id in sockets) {
        const sc = sockets[id];
        if (Object.hasOwn(sc, 'uname')) {
            socket.write(`${sc.uname}\t\tClient ${sc.id}\t${sc.remoteAddress}:${sc.remotePort}\n`);
            loggedInUsers++;
        }
    }
    socket.write(`${loggedInUsers} logged in users.`);
    return;
}

// display client id or logged in username
export function whoami(spinner, socket, socketId: number) {
    spinner.info(`Client ${socketId} sent whoami command.`);

    if (Object.hasOwn(socket, 'uname')) {
        socket.write(socket.uname);
    } else {
        socket.write(`Client ${socketId}`);
    }

    return;
}

// help list of commands
export function help(socket) {
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
