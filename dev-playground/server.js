const evaluator = require("./CodeEvaluator");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const port = 3001;
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const io = require('socket.io')(server, { pingInterval: 5000 });

let files = {};

//TODO replace with .flatMap
[path.join('../tmrowapp-contrib/integrations/electricity/'), path.join('../tmrowapp-contrib/integrations/transportation/')]
	.forEach(dir => fs.readdir(dir, (pErr, file) =>
		file.forEach(f =>
			fs.readFile(dir + '/' + f, {encoding: 'utf-8'},
				(fErr, data) => files[f] = data))));

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
	next();
});


app.options('*', (req, res) => res.sendStatus(200));

server.listen(port, (err) => {
	if (err) throw err;
	console.log('Server Running');
});

app.get('/get-integrations', (err, res) => {
	res.status(200);
	res.json(files);
	res.end();
});

let socket = null;

io.on('connection', (s) => {
	console.log('New websocket connection ', s.handshake.headers.origin);
	socket = s;
});



app.post('/evaluate-code', async (req, res) => {
	res.status(200);
	res.json(await evaluator.evaluate(req.body.code, req.body.authDetails, req.body.env));
	console.log('Responding\n----------------------------------------------------------------------------');
	res.end();
});


const emitOpenUrl = (url) =>
	socket.emit("openUrl", url, (data) => console.log('', data));

const emitResults = (results) =>
	socket.emit("setResults", results);


module.exports = {emitOpenUrl, emitResults};
