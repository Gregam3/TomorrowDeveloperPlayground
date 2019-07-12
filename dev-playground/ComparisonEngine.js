const parser = require("@babel/parser");
const deepDiff = require("deep-diff").diff;
const TreeSurgeon = require("./TreeSurgeon");
const handler = require("./CodeHandler");

const FUN_NAMES = ["connect", "collect", "disconnect"];

const compareIntegration = integrationCode => {
	let bestMatches = {
		connect: { similiarity: Number.MAX_VALUE },
		collect: { similiarity: Number.MAX_VALUE },
		disconnect: { similiarity: Number.MAX_VALUE }
	};

	const transformFuns = funs => {
		let integration = {};
		Object.keys(funs).forEach(
			fn =>
				(integration[fn] = TreeSurgeon.eliminateLoggingNodes(
					TreeSurgeon.flattenAST(funs[fn].body.body, funs).map(
						TreeSurgeon.eliminateNodeDetails
					)
				))
		);

		return integration;
	};

	let integration = transformFuns(extractTopLevelFuns(integrationCode));

	Object.keys(handler.files.all).forEach(fileName => {
		const currentIntegration = transformFuns(
			extractTopLevelFuns(handler.files.all[fileName])
		);

		FUN_NAMES.forEach(funName => {
			let similiarity =
				(compareFunASTs(integration[funName], currentIntegration[funName]) +
					//get Inverse value but use as a third of total value
					compareFunASTs(currentIntegration[funName], integration[funName])) *
				100;

			console.log(
				fileName,
				funName,
				similiarity,
				integration[funName].length,
				currentIntegration[funName].length
			);

			if (similiarity < bestMatches[funName].similiarity) {
				bestMatches[funName] = {
					name: fileName,
					similiarity
				};
			}
		});
	});

	//Import modules to fetch original function code
	let importedModules = [];

	Object.keys(bestMatches).forEach(fnM => {
		handler.files.paths
			.filter(p => p.endsWith(bestMatches[fnM].name))
			//forEach should only run once
			.forEach(p => {
				const path = p.replace(".js", "");
				bestMatches[fnM].body = require(path).default[fnM].toString();
				importedModules.push(path);
			});
	});

	//Delete modules after function code is fetched
	importedModules.forEach(m => delete require.cache[require(m)]);

	return bestMatches;
};

const parse = code =>
	parser.parse(code, {
		sourceType: "module"
	}).program.body;

const extractTopLevelFuns = code => {
	let funs = {};

	parse(code)
		.filter(node => node.type === "FunctionDeclaration")
		.forEach(fnNode => (funs[fnNode.id.name] = fnNode));

	return funs;
};

//Used for testing purposes
const getSimiliarity = (baseFunStr, compareFunStr) => {
	const getFlatAST = code =>
		TreeSurgeon.eliminateLoggingNodes(
			TreeSurgeon.flattenAST(
				parse(code)[0].body.body,
				extractTopLevelFuns(code)
			).map(TreeSurgeon.eliminateNodeDetails)
		);

	// console.log(
	// 	countKeys(getFlatAST(baseFunStr)),
	// 	countKeys(getFlatAST(compareFunStr))
	// );

	// console.log(
	// 	getFlatAST(baseFunStr).length,
	// 	getFlatAST(compareFunStr).length
	// );

	return compareFunASTs(getFlatAST(baseFunStr), getFlatAST(compareFunStr));
};

//Tune these values D and N should be kept as the same value
const DIFF_VALUES = { D: 8, N: 8, E: 1, A: 0.2 };

//Tune this value to change the weighting of node size difference
const MODIFIER_EXPONENT = 1.1;

const compareFunASTs = (nodes, compareNodes) => {
	//Array used to retrieve range to map
	let matches = [...Array(nodes.length).keys()].map(node => {
		return {
			node: nodes[node],
			comparisons: [...Array(compareNodes.length).keys()].map(compareIndex => {
				return {
					similiarity: calculateSimiliarity(
						nodes[node],
						compareNodes[compareIndex]
					),
					compareIndex
				};
			})
		};
	});

	//Sort Comparison hiearchies inside of each node, ascending order.
	let nodeMatches = matches.map(match => {
		return {
			node: match.node,
			comparisons: match.comparisons.sort(
				(l, r) => l.similiarity - r.similiarity
			)
		};
	});

	//Eliminate duplicate matches
	[...Array(nodeMatches.length).keys()].map(i => {
		let compareResult = compareMatch(i, nodeMatches);

		while (compareResult.compare !== 0) {
			if (compareResult.compare === 1) nodeMatches[i].comparisons.shift();
			else nodeMatches[compareResult.index].comparisons.shift();

			compareResult = compareMatch(i, nodeMatches);
		}
	});

	let modifier = Math.pow(
		nodeMatches.filter(match => match.comparisons.length === 0).length,
		MODIFIER_EXPONENT
	);
	//To use 1 as a base, cannot be set before incase filter yields 0
	modifier++;

	//Sets a base level of disimilarity so modifier can be made use of if similarity is 0
	let similiarity = modifier > 1 ? modifier - 1 : 0;

	//Finally uses best matched nodes to complete comparison
	nodeMatches
		.filter(match => match.comparisons.length > 0)
		.forEach(match => {
			similiarity += match.comparisons[0].similiarity;
		});

	return (similiarity * modifier) / countKeys(nodes);
};

//0: does not share, 1: original node is more similiar, -1: compare node is more similiar
const compareMatch = (index, matches) => {
	if (matches[index].comparisons.length === 0) return { index: -1, compare: 0 };

	for (let i = 0; i < matches.length; i++) {
		if (
			matches[i].comparisons.length > 0 &&
			matches[index].comparisons[0].compareIndex ===
				matches[i].comparisons[0].compareIndex &&
			index !== i
		) {
			return {
				index: i,
				compare:
					matches[index].comparisons[0].similiarity >
					matches[i].comparisons[0].similiarity
						? 1
						: -1
			};
		}
	}

	return { index: -1, compare: 0 };
};

const DIFF_SUM = Object.keys(DIFF_VALUES)
	.map(k => DIFF_VALUES[k])
	.reduce((l, r) => l + r);

const MAX_DIFF_VALUE = 200 / DIFF_SUM;

const calculateSimiliarity = (node1, node2) => {
	let diffValue = 0;

	const diff = deepDiff(node1, node2);
	if (diff) diff.forEach(d => (diffValue += DIFF_VALUES[d.kind]));
	return diffValue;
};

const countKeys = obj => {
	if (!obj.length) return 1;
	return JSON.stringify(obj).match(/[^\\]":/g).length;
};

module.exports.compareIntegration = compareIntegration;
module.exports.getSimiliarity = getSimiliarity;
