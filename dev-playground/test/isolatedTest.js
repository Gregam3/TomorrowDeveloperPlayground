const assert = require("assert");
const engine = require("../ComparisonEngine");
const fs = require("fs");

describe("\nIsolated  Test", () => {
	context("Logless code vs logging code", () => {
		let a = fs.readFileSync(
			"/home/grg/Projects/TomorrowDeveloperPlayground/dev-playground/moss/a.js",
			"utf-8"
		);

		let b = fs.readFileSync(
			"/home/grg/Projects/TomorrowDeveloperPlayground/dev-playground/moss/b.js",
			"utf-8"
		);

		const start = new Date().getTime();
		console.log(engine.getSimiliarity(a, b));
		console.log(new Date().getTime() - start + "ms");
	});
});
