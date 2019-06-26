const parser = require("@babel/parser");
const deepDiff = require("deep-diff").diff;
const treeSurgeon = require("./TreeSurgeon");
const handler = require("./CodeHandler");

const FUN_NAMES = ["connect", "collect", "disconnect"];

const compareIntegration = integration => {
	let bestMatches = {
		connect: { similiarity: Number.MAX_VALUE },
		collect: { similiarity: Number.MAX_VALUE },
		disconnect: { similiarity: Number.MAX_VALUE }
	};

	handler.files.paths.forEach(p => {
		const currentIntegration = require(p.replace(".js", "")).default;

		FUN_NAMES.forEach(funName => {
			let similiarity =
				(getSimiliarity(
					integration[funName].toString(),
					currentIntegration[funName].toString()
				) +
					//get Inverse value but use as a third of total value
					getSimiliarity(
						currentIntegration[funName].toString(),
						integration[funName].toString()
					)) *
				100;
			if (similiarity < bestMatches[funName].similiarity) {
				bestMatches[funName] = {
					name: p
						.split("/")
						.slice(-1)
						.pop(),
					similiarity,
					body: currentIntegration[funName].toString()
				};
			}
		});
		delete require.cache[require(p.replace(".js", ""))];
	});

	return bestMatches;
};

const getSimiliarity = (baseFunStr, compareFunStr) => {
	const getFlatAST = code =>
		treeSurgeon.flattenAST(
			parser
				.parse(code, {
					sourceType: "module"
				})
				//Gets the function body
				.program.body[0].body.body.map(treeSurgeon.elimateNodeDetails)
		);

	return compareFunAST(getFlatAST(baseFunStr), getFlatAST(compareFunStr));
};

const DIFF_VALUES = { D: 10, N: 10, A: 5, E: 2.5 };

const compareFunAST = (nodes, compareNodes) => {
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

	let modifier =
		nodeMatches.filter(match => match.comparisons.length === 0).length * 0.5;
	//To use 1 as a base, cannot be set before incase filter yields 0
	modifier++;

	let similiarity = modifier > 1 ? 10 * modifier : 0;

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

const calculateSimiliarity = (node1, node2) => {
	let diffValue = 0;

	const diff = deepDiff(node1, node2);
	if (diff) diff.forEach(d => (diffValue += DIFF_VALUES[d.kind]));
	return diffValue > 5 ? 5 : diffValue;
};

const countKeys = obj => {
	if (!obj.length) return 1;
	return JSON.stringify(obj).match(/[^\\]":/g).length;
};

module.exports.compareIntegration = compareIntegration;
module.exports.getSimiliarity = getSimiliarity;
