# simple-chatroom

A simple cli chat room (localhost only) that includes a client and a server.
Clients can login or create a new user, send messages, see who is logged in, and logout.
Server manages the chat room, clients, and message distribution.
Communication is over TCP using the [net](https://nodejs.org/api/net.html) module of Node.js.

## Install

`npm install`

## Build

`npm run build`

## Run

`npm start` to prompt for client or server.

`npm start server` from one shell. Stop with Ctrl+C.

`npm start client` from another shell. Stop with `exit` command or Ctrl+C.

## Clean

`npm run clean`

## Usage

Client commands: help, login, logout, newuser, who, send [all|UserID], exit

Server will create a login file on first run if none exists.

## Dependencies

* [ora](https://github.com/sindresorhus/ora)
* [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
