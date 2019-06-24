const engine = require("../ComparisonEngine");
const assert = require("assert");

describe("\nStructurally Identical Functions", () => {
	let testIndex = 1;
	context(testIndex++ + ". same parameter", () => {
		const a = `function a() {console.log("test");}`;
		const b = `function b() {console.log("test");}`;

		it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
	});

	context(testIndex++ + ". different parameter", () => {
		const a = `function a() {console.log("hello");}`;
		const b = `function b() {console.log("world");}`;

		it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
	});

	context(testIndex++ + ". different node order", () => {
		const a = `function a() {
                    let x = 5;
                    console.log("test");
                }`;
		const b = `function b() {
                    console.log("test");
                    let x = 5;
                }`;

		it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
	});

	context(testIndex++ + ". different node order flattened - if", () => {
		const a = `function a() {
                    console.log(3);
                    if(true){
                        let x = 5;
                        console.log("test");
                    }
                }`;
		const b = `function b() {
                    if(true) {
                        let x = 5;
                        console.log("test");
                    }
                    console.log(3);
                }`;

		it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
	});

	context(testIndex++ + ". different node order flattened - while", () => {
		const a = `function a() {
                    console.log(3);
                    while(true){
                        let x = 5;
                        console.log("test");
                    }
                }`;
		const b = `function b() {
                    while(true) {
                        let x = 5;
                        console.log("test");
                    }
                    console.log(3);
                }`;

		it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
	});

	context(testIndex++ + ". different node order flattened - do-while", () => {
		const a = `function a() {
                    console.log(3);
                    do {
                        let x = 5;
                        console.log("test");
                    } while (true);
                }`;
		const b = `function b() {
                    do {
                        let x = 5;
                        console.log("test");
                    } while (true);
                    console.log(3);
                }`;

		it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
	});

	context(testIndex++ + ". different node order flattened - for", () => {
		const a = `function a() {
                    console.log(3);
                    for(let i = 0; i< 10; i++) {
                        let x = 5;
                        console.log("test");
                    }
                }`;
		const b = `function b() {
                    for(let i = 0; i< 10; i++) {
                        let x = 5;
                        console.log("test");
                    } 
                    console.log(3);
                }`;

		it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
	});

	context(
		testIndex++ + ". different node order flattened - lambda with block",
		() => {
			const a = `function a() {
                    console.log(3);
                    [].forEach(i => {
                        let x = 5;
                        console.log("test");
                    })
                }`;
			const b = `function b() {
                    [].forEach(i => {
                        let x = 5;
                        console.log("test");
                    })
                    console.log(3);
                }`;

			it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
		}
	);

	context(
		testIndex++ + ". different node order flattened - inner function",
		() => {
			const a = `function a() {
                    console.log(3);
                   function test() {
                        let x = 5;
                        console.log("test");
                    }
                }`;
			const b = `function b() {
                   function test() {
                        let x = 5;
                        console.log("test");
                    }
                    console.log(3);
                }`;

			it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
		}
	);

	context(
		testIndex++ +
			". different node order flattened - lambda with block" +
			" and different function",
		() => {
			const a = `function a() {
                    console.log(3);
                    [].forEach(i => {
                        let x = 5;
                        console.log("test");
                    })
                }`;
			const b = `function b() {
                    [].map(i => {
                        let x = 5;
                        console.log("test");
                    })
                    console.log(3);
                }`;

			it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
		}
	);

	context(testIndex++ + ". different node order - lambda without block", () => {
		const a = `function a() {
                    console.log(3);
                    [].forEach(i => console.log("test"))
                }`;
		const b = `function b() {
                    console.log(3);
                    [].forEach(i => console.log("test"))
                    
                }`;

		it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
	});

	context(
		testIndex++ +
			". different node order interally in " +
			"control structure flattened",
		() => {
			const a = `function a() {
                    if(true){
                        console.log("test");
                        let x = 5;
                    }
                    console.log(3);
                }`;
			const b = `function b() {
                    if(true) {
                        console.log("test");
                        let x = 5;
                    }
                    console.log(3);
                }`;

			it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
		}
	);

	context(testIndex++ + ". multi-level node mixup", () => {
		const a = `function a() {
                    console.log(3);
                   function test() {
                       if(true) {
                            let x = 5;
                       } else {
                            console.log("test");
                       }
                    }
                }`;
		const b = `function b() {
                   function test() {
                        let x = 5;
                        console.log("test");
                    }

                    if(true) {
                            let x = 5;
                       } else {
                            console.log("test");
                       }
                    console.log(3);
                }`;

		it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
	});

	context(testIndex++ + ". Braceless if vs if", () => {
		const a = `function a() {
                    if(true) {
                        console.log("test");
                    }
                }`;
		const b = `function a() {
                    if(true) 
                        console.log("test");
                }`;

		it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
	});

	context(testIndex++ + ". Braceless while vs while", () => {
		const a = `function a() {
                    while(true) {
                        console.log("test");
                    }
                }`;
		const b = `function a() {
                    while(true) 
                        console.log("test");
                }`;

		it("should return 0", () => assert(engine.getSimiliarity(a, b) === 0));
	});
});

describe("\nStructurally Similiar Functions", () => {
	let testIndex = 1;
	context(testIndex++ + ". different literal type", () => {
		const a = `function a() {let r = "test";}`;
		const b = `function b() {let q = 3;}`;

		it("should return more than 0", () =>
			assert(engine.getSimiliarity(a, b) > 0));
	});

	context(testIndex++ + ". different variable modifier", () => {
		const a = `function a() {let r = "test";}`;
		const b = `function b() {const q = "sadasd";}`;

		it("should return more than 0", () =>
			assert(engine.getSimiliarity(a, b) > 0));
	});
});

describe("\nLength Coefficient Tests", () => {
	let testIndex = 1;
	context(testIndex++ + ". different literal type", () => {
		const a = `function a() {
            let r = "test";
            const t = true;
        }`;
		const b = `function b() {
            let q = "asdasd";
            console.log("hello");
        }`;

		const a1 = `function a() {
            let r = "test";
            const t = true;

            if(true) {
                const v = r + 3;
                new Date().getTime();
                sleep(300)
            }
        }`;

		const b1 = `function b() {
            let r = "test";
            const t = true;

            if(true) {
                console.log("here");
                console.log(32.5);
                sleep(300)
            }
        }`;

		console.log(
			"here",
			engine.getSimiliarity(a, b),
			engine.getSimiliarity(a1, b1)
		);

		it("a-b similiarity less than a1-b1 similiarity", () =>
			assert(engine.getSimiliarity(a, b) > engine.getSimiliarity(a1, b1)));
	});
});
