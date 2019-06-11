const server = require("./server");

const fs = require('fs');
const FUN_NAMES = ["connect", "collect", "disconnect", "config"];

const exportCode = `\n\nexport {${FUN_NAMES.join(',')}};`;
let stub = null;

async function evaluate(code, authDetails, env, id, stateInjection) {
	console.log('Began Evaluating');
	const basePackage = './integration-test/' + id;

	function createSessionPackage() {
		if (!fs.existsSync(basePackage)) {
			console.log('Creating session package: ' + basePackage);
			fs.mkdirSync(basePackage);
			fs.appendFileSync(basePackage + '/integration.js', '');
			fs.appendFileSync(basePackage + '/env.js', '');
		} else console.log('Session package already exists')
	}

	function writeEnv() {
		return new Promise((resolve, reject) => {
			if (env) fs.writeFile(basePackage + '/env.js',
				`module.exports = ` + objectToCode(env), (err) => {
					if (err) {
						console.log('Env File Writing error:' + err);
						reject()
					}
					console.log('Wrote Env');
					resolve()
				});
			else resolve("No env")
		});
	}

	function importIntegration() {
		return new Promise((resolve, reject) => {
			console.log('Deleting cached Integration module');
			delete require.cache[require.resolve(basePackage + '/integration.js')];
			console.log('Importing new integration');
			try {
				stub = require(basePackage + "/integration");
			} catch (e) {
				sendError(e);
			}
			if (stub) resolve();
			else reject();
		});
	}

	function writeCode() {
		return new Promise((resolve, reject) => {
			fs.writeFile(basePackage + '/integration.js', code + exportCode, (err) => {
				if (err) {
					console.log('File Writing error:' + err);
					reject()
				}
				console.log('Wrote Code');
				resolve();
			});
		});
	}
	createSessionPackage();
	return writeEnv().then(() =>
		writeCode().then(() =>
			importIntegration().then(() =>
				assessFunctions(stub, authDetails, stateInjection))));
}

function objectToCode(env) {
	return '{' + Object.keys(env).map(k => k + ':"' + env[k] + '"').join(",") + '};';
}

async function assessFunctions(stub, authDetails, stateInjection) {
	const requestLogin = authDetails.username && authDetails.password ? () => {
		return { username: authDetails.username, password: authDetails.password }
	} : () => { };

	const requestWebView = (url, callbackUrl) => {
		return new Promise((resolve, reject) => {
			if (!url) reject();

			server.setWebView(resolve);
			server.emitOpenUrl(url);
		});
	};

	console.log('Assessing Functions, integration logs [');

	try {
		if (Object.keys(stateInjection).length > 0) {
			console.log('Injecting state', stateInjection);
			server.emitResults(await {
				connect: {},
				collect: await stub.collect(stateInjection, 
					{ logWarning: (err) => console.log(err) }),
				disconnect: {},
				config: stub.config
			});
		} else {
			console.log('No state injection found, executing normally.');
			const connectResult = await stub.connect(requestLogin, requestWebView);
			server.emitResults(await {
				connect: connectResult,
				collect: await stub.collect(connectResult, 
					{ logWarning: (err) => console.log(err) }),
				disconnect: await stub.disconnect(),
				config: stub.config
			});
		}
		console.log("]");
	} catch (e) {
		sendError(e);
	}
}

function readCode(id) {
	const path = './integration-test/' + id;
	let code = null;

	if (fs.existsSync(path)) {
		code = fs.readFileSync(path + '/integration.js').toString()
			.replace('export {connect,collect,disconnect,config};', '');
	}

	return code;
}

function sendError(error) {
	console.log("]");
	console.log('Error whilst processing code', error);
	server.emitError(error);
}

module.exports.evaluate = evaluate;
module.exports.readCode = readCode;

