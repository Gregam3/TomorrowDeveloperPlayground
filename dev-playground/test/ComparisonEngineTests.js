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
	context(
		testIndex++ + ". Longer less similiar method is judged as such",
		() => {
			const a = `function a() {
            let r = "test";
            const t = true;
        }`;
			const b = `function b() {
            let q = "asdasd";
            console.log("hello");
            new Date().getTime();
            sleep(300);
        }`;

			const a1 = `function a() {
            let r = "test";
            const t = true;

            if(true) {
                const v = r + 3;
                new Date().getTime();
                sleep(300);
            }
        }`;

			const b1 = `function b() {
            let r = "test";
            const t = true;

            if(true) {
                console.log("here");
                console.log(32.5);
                sleep(300);
            }
        }`;

			console.log(
				"here",
				engine.getSimiliarity(a, b),
				engine.getSimiliarity(a1, b1)
			);

			it("a-b similiarity greater than a1-b1 similiarity", () =>
				assert(engine.getSimiliarity(a, b) > engine.getSimiliarity(a1, b1)));
		}
	);

	context(
		testIndex++ + ". Longer more similiar method is judged as such",
		() => {
			const a = `function a() {
            let r = "test";
            const t = true;
        }`;
			const b = `function b() {
            let q = "asdasd";
            console.log("hello");
            new Date().getTime();
            sleep(300);
        }`;

			const a1 = `function a() {
            let r = "test";
            const t = true;

            if(true) {
                const v = r + 3;
                new Date().getTime();
                new Date().getTime();
                sleep(300);
            }
        }`;

			const b1 = `function b() {
            let r = "test";
            const t = true;

            if(true) {
                console.log("here");
                console.log(32.5);
                sleep(300);
            }
        }`;

			console.log(
				"here",
				engine.getSimiliarity(a, b),
				engine.getSimiliarity(a1, b1)
			);

			it("a-b similiarity less than a1-b1 similiarity", () =>
				assert(engine.getSimiliarity(a, b) < engine.getSimiliarity(a1, b1)));
		}
	);
});

describe("\nMisc Tests", () => {
	let testIndex = 1;
	context(
		testIndex++ + ". Identical methods expect for a single line console.log",
		() => {
			const a = `async function collect(state, { logWarning }) {
                const {
                    username, password, meteringPointId, priceRegion,
                } = state;

                const startDate = state.lastFullyCollectedDay || moment().subtract(1, 'month').toISOString();
                const endDate = moment().toISOString();

                const response = await getHourlyConsumption(
                    username, password, meteringPointId,
                    startDate, endDate,
                );

                // Note: some entries contain more than 24 values.
                // that's because they cover several days
                // we need to separate those manually
l
                const { locationLon, locationLat } = REGION_TO_LOCATION[priceRegion];

                let x = 10;

                /*
                    Note: right now days are defined as UTC days.
                    We should probably use local time to define days
                */

                const activities = Object.entries(groupBy(response, d => moment(d.date).startOf('day').toISOString()))
                    .map(([k, values]) => ({
                    id: \`barry\${k}\`,
                    datetime: moment(k).toDate(),
                    activityType: ACTIVITY_TYPE_ELECTRICITY,
                    energyWattHours: values
                        .map(x => x.value * 1000.0) // kWh -> Wh
                        .reduce((a, b) => a + b, 0),
                    durationHours: values.length,
                    hourlyEnergyWattHours: values.map(x => x.value * 1000.0),
                    locationLon,
                    locationLat,
                    }));
                activities
                    .filter(d => d.durationHours !== 24)
                    .forEach(d => logWarning(\`Ignoring activity from \${d.datetime.toISOString()} with \${d.durationHours} hours instead of 24\`));

                if (!activities.length) {
                    return { activities: [] };
                }

                // Subtract one day to make sure we always have a full day
                const lastFullyCollectedDay = moment(activities[activities.length - 1].datetime)
                    .subtract(1, 'day').toISOString();

                return {
                    activities: activities.filter(d => d.durationHours === 24),
                    state: { ...state, lastFullyCollectedDay },
                };
                }`;
			const b = `async function collect(state, { logWarning }) {
                            const {
                                username, password, meteringPointId, priceRegion,
                            } = state;

                            const startDate = state.lastFullyCollectedDay || moment().subtract(1, 'month').toISOString();
                            const endDate = moment().toISOString();

                            const response = await getHourlyConsumption(
                                username, password, meteringPointId,
                                startDate, endDate,
                            );

                            // Note: some entries contain more than 24 values.
                            // that's because they cover several days
                            // we need to separate those manually

                            const { locationLon, locationLat } = REGION_TO_LOCATION[priceRegion];

                            /*
                                Note: right now days are defined as UTC days.
                                We should probably use local time to define days
                            */

                            const activities = Object.entries(groupBy(response, d => moment(d.date).startOf('day').toISOString()))
                                .map(([k, values]) => ({
                                id: \`barry\${k}\`,
                                datetime: moment(k).toDate(),
                                activityType: ACTIVITY_TYPE_ELECTRICITY,
                                energyWattHours: values
                                    .map(x => x.value * 1000.0) // kWh -> Wh
                                    .reduce((a, b) => a + b, 0),
                                durationHours: values.length,
                                hourlyEnergyWattHours: values.map(x => x.value * 1000.0),
                                locationLon,
                                locationLat,
                                }));
                            activities
                                .filter(d => d.durationHours !== 24)
                                .forEach(d => logWarning(\`Ignoring activity from \${d.datetime.toISOString()} with \${d.durationHours} hours instead of 24\`));

                            if (!activities.length) {
                                return { activities: [] };
                            }

                            // Subtract one day to make sure we always have a full day
                            const lastFullyCollectedDay = moment(activities[activities.length - 1].datetime)
                                .subtract(1, 'day').toISOString();

                            return {
                                activities: activities.filter(d => d.durationHours === 24),
                                state: { ...state, lastFullyCollectedDay },
                            };
                            }`;

			console.log(engine.getSimiliarity(a, b));

			it("Similiarity should be under 10", () =>
				assert(engine.getSimiliarity(a, b) < 10));
		}
	);
});
