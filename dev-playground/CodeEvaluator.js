const fs = require('fs');
const FUN_NAMES = ["connect", "collect", "disconnect", "config"];

const exportCode = `\n\nexport {${FUN_NAMES.join(',')}};`;
let stub = null;


async function evaluate(code, username, password, env) {
	console.log('Began Evaluating');

	function writeEnv() {
		return new Promise((resolve, reject) => {
			if (env) fs.writeFile('./integration-test/env.js',
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
			import("./integration-test/integration").then((module) => {
				console.log('Importing integration');
				stub = module;
				if (module) resolve();
				else reject();
			});
		});
	}

	function writeCode() {
		return new Promise((resolve, reject) => {
			fs.writeFile('./integration-test/integration.mjs', code + exportCode, (err) => {
				if (err) {
					console.log('File Writing error:' + err);
					reject()
				}
				console.log('Wrote Code');
				resolve();
			});
		});
	}

	return writeEnv().then(() =>
		writeCode().then(() =>
			importIntegration().then(() =>
				assessFunctions(stub, username, password))));
}


function objectToCode(env) {
	return '{' + Object.keys(env).map(k => k + ':"' + env[k] + '"').join(",") + '};';
}

async function assessFunctions(stub, username, password) {
	console.log('Assessing Functions');
	const connectResult = await stub.connect(() => {
		return {username, password}
	}, () => {
	});

	return await {
		connect: connectResult,
		collect: await stub.collect(connectResult, {logWarning: (err) => console.log(err)}),
		disconnect: await stub.disconnect(),
		config: stub.config
	};
}

module.exports.evaluate = evaluate;


