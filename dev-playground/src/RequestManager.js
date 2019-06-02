import request from 'superagent';


export function getIntegrations() {
	return request
		.get('http://' +window.location.hostname + ':3001/get-integrations')
		.then(res => {
			return JSON.parse(res.text);
		})
		.catch(err => {
			console.log(err);
			return null;
		});
}


export function evaluateCode(code, username, password, env) {
	//Cannot use get with body from browser
	return request
		.post('http://' +window.location.hostname + ':3001/evaluate-code')
		.send({code, username, password, env})
		.then(res => JSON.parse(res.text))
		.catch(err => {
			console.log(err);
			return null;
		});
}
