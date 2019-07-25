const assert = require("assert");
const engine = require("../ComparisonEngine");
const fs = require("fs");

describe("\nIsolated  Test", () => {
	console.log("Greater than 1");
	let a, b;

		a = fs.readFileSync(
			"/home/grg/Projects/TomorrowDeveloperPlayground/dev-playground/comparison-tests/" +
				i +
				"a.js",
			"utf8"
		);

		b = fs.readFileSync(
			"/home/grg/Projects/TomorrowDeveloperPlayground/dev-playground/comparison-tests/" +
				i +
				"b.js",
			"utf8"
		);

		console.log(engine.getSimiliarity(a, b) + engine.getSimiliarity(b, a));
	}
});
