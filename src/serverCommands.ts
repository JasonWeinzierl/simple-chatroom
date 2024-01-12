/**
 * server functionality to handle client data
 */
import { appendFile } from 'fs';
import { Socket } from 'net';
import { compareSync, hashSync } from 'bcrypt';
import { Ora } from 'ora';

export interface ChatClient {
    id: number;
    socket: Socket;
    uname?: string;
}

// client request disconnect
export function exit(spinner: Ora, clients: ChatClient[], client: ChatClient): void {
    spinner.info(`Client ${client.id} sent exit command.`);
    for (const c of clients) {
        if (client.uname) {
            c.socket.write(`${client.uname} logged out.  `);
        }
        c.socket.write(`Client ${client.id} disconnected from room.`);
    }
    client.socket.end();
    return;
}

// validate and do client login
export function login(spinner: Ora, clients: ChatClient[], client: ChatClient, data: string, logins: Record<string, string>): void {
    const args = data.split(' ');
    const username = args[0];
    const password = args[1];

    if (client.uname) {
        client.socket.write('Already logged in.');
        spinner.info(`User "${client.uname}" attempted relogin with "${username}".`);
        return;
    }

    if (!username || !password) {
        client.socket.write('You cannot login with empty information.');
        spinner.info(`Client ${client.id} sent empty login command.`);
        return;
    }

    if (username === 'all') {
        client.socket.write('You cannot login with a username containing a disallowed phrase.');
        spinner.info(`Client ${client.id} attempted login with disallowed username 'all'.`);
        return;
    }

    const hashedPassword = logins[username];
    if (!hashedPassword) {
        client.socket.write('Username or password incorrect.');
        spinner.warn(`${username} was provided as incorrect username on Client ${client.id}.`);
        return;
    }

    if (!compareSync(password, hashedPassword)) {
        client.socket.write('username or Password incorrect.');
        spinner.warn(`Failed login attempt to ${username} on Client ${client.id}.`);
        return;
    }

    // login user
    client.uname = username;

    // notify of login
    spinner.succeed(`Logged in user ${client.uname.toString()} on Client ${client.id}`);
    for (const c of clients) {
        c.socket.write(`${client.uname} logged in.`);
    }

    return;

}

// client request logout
export function logout(spinner: Ora, clients: ChatClient[], client: ChatClient): void {
    if (!client.uname) {
        client.socket.write('You are not logged in. ');
        spinner.info(`Failed logout command from Client ${client.id}.`);
        return;
    }

    for (const c of clients) {
        c.socket.write(`${client.uname} logged out.`);
    }

    spinner.succeed(`${client.uname} logged out from Client ${client.id}`);
    delete client.uname;

    //socket.end();

    return;
}

// client creates new user and login
export function newuser(spinner: Ora, clients: ChatClient[], client: ChatClient, data: string, logins: Record<string, string>): void {
    const args = data.split(' ');
    const username = args[0];
    const password = args[1];

    if (!username || !password) {
        client.socket.write('You cannot create a new user with empty information.');
        spinner.info(`Client ${client.id} sent empty newuser command.`);
        return;
    }

    if (client.uname) {
        client.socket.write('Already logged in.');
        spinner.info(`User "${client.uname}" attempted newuser.`);
        return;
    }

    if (username.length >= 32) {
        client.socket.write('UserID is too long.');
        spinner.info(`Client ${client.id} failed newuser with long username ${username.substring(0, 32)}...`);
        return;
    }

    if (username === 'all') {
        client.socket.write('UserID contains a disallowed phrase.');
        spinner.info(`Client ${client.id} failed newuser with disallowed username 'all'.`);
        return;
    }

    // password policy
    const minLength = 8;
    const maxLength = 64;
    if (password.length < minLength || password.length > maxLength) {
        client.socket.write(`Password length must be between ${minLength} and ${maxLength} characters.`);
        spinner.info(`Client ${client.id} failed newuser with out-of-range password.`);
        return;
    }

    // hash password
    const hashedPassword = hashSync(password, 10);

    // save to logins.txt
    appendFile('logins.txt', `${username}:${hashedPassword}\n`, 'utf8', err => {
        if (err) {
            spinner.fail(err.message);
            client.socket.write('Error saving login.  Please contact server admin.');
            return;
        } else {
            // add to loaded login data
            logins[username] = hashedPassword;

            spinner.succeed(`${username} appended to logins.txt`);
        }
    });

    // login in user
    client.uname = username;

    // notify of new user and login
    spinner.succeed(`Created and logged in user ${client.uname.toString()} on Client ${client.id}`);
    for (const c of clients) {
        c.socket.write(`${client.uname} logged in with a new account.`);
    }

    return;
}

// send message to all or a specific user
export function send(spinner: Ora, clients: ChatClient[], client: ChatClient, data: string): void {
    // isolate intended recipient and message
    const intended = !data.includes(' ') ? data : data.substring(0, data.indexOf(' '));
    const message = !data.includes(' ') ? '' : data.substring(data.indexOf(' ') + 1);

    // check for login
    if (!client.uname) {
        client.socket.write('Denied.  Please log in first.\n');
        spinner.warn(`Client ${client.id} attempted to send "${message}" to ${intended} without login.`);
        return;
    }

    // check empty message
    if (!message) {
        client.socket.write('Cannot send empty message.\n');
        spinner.warn(`${client.uname} tried to send empty message to ${intended}.`);
        return;
    }

    // ALL
    if (intended.localeCompare('all') === 0) {
        // broadcast message to all logged in users
        for (const c of clients) {
            if (c.uname) {
                c.socket.write(`${client.uname}: ${message}`);
            }
        }
        console.log(`${client.uname} (to all): ${message}`);
        return;
    }

    // find intended and write message to them
    let found = false;
    if (client.uname.localeCompare(intended) === 0) {
        client.socket.write(`Message from yourself: ${message}`);
        console.log(`${client.uname} (to themself): ${message}`);
        return;
    } else {
        for (const c of clients) {
            if (c.uname?.localeCompare(intended) === 0) {
                c.socket.write(`${client.uname} (to you): ${message} `);
                client.socket.write(`${client.uname} (to ${c.uname}): ${message}`);
                console.log(`${client.uname} (to ${c.uname}): ${message}`);
                found = true;
            }
        }
    }
    if (!found) {
        client.socket.write(`${intended} is not on this server. `);
        spinner.info(`${client.uname} failed to send message to "${intended}".`);
    }
    return;
}

// display all logged in users
export function who(spinner: Ora, clients: ChatClient[], client: ChatClient): void {
    spinner.info(`Client ${client.id} sent who command.`);

    let loggedInUsers = 0;
    for (const c of clients) {
        if (c.uname) {
            client.socket.write(`${c.uname}\t\tClient ${c.id}\t${c.socket.remoteAddress}:${c.socket.remotePort}\n`);
            loggedInUsers++;
        }
    }
    client.socket.write(`${loggedInUsers} logged in users.`);
    return;
}

// display client id or logged in username
export function whoami(spinner: Ora, client: ChatClient): void {
    spinner.info(`Client ${client.id} sent whoami command.`);

    if (client.uname) {
        client.socket.write(client.uname);
    } else {
        client.socket.write(`Client ${client.id}`);
    }

    return;
}

// help list of commands
export function help(client: ChatClient): void {
    client.socket.write(`
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
