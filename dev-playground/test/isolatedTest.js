const assert = require("assert");
const engine = require("../ComparisonEngine");

describe("\nIsolated  Test", () => {
	context("Logless code vs logging code", () => {
		const a = `function a() {
                        console.log("test");
                        let x = 10;
                }`;
		const b = `function a() {
                    let x = 10;
                }`;

		it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
	});
});
