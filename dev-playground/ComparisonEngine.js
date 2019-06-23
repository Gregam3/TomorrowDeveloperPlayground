const parser = require("@babel/parser");
const deepDiff = require("deep-diff").diff;
const deepClone = require("lodash.clonedeep");

// const FUN_NAMES = ["connect", "collect", "disconnect"];
const FUN_NAMES = ["one", "two"];

const getDASubtrees = code => {
	const AST = parser.parse(code, {
		sourceType: "module"
	}).program.body;
	let funASTs = [];

	AST.forEach(n => {
		// if (n.type === 'FunctionDeclaration' && FUN_NAMES.includes(n.id.name))
		//     funs[n.id.name] = elimateNodeDetails(n);
		if (n.type !== "EmptyStatement") funASTs.push(elimateNodeDetails(n));
	});

	//body.body takes the body of the block statement following a function (i.e. all nodes inside)
	return compareFunAST(
		flattenAST(funASTs[0].body.body),
		flattenAST(funASTs[1].body.body)
	);
};

const DIFF_VALUES = { D: 10, N: 10, A: 5, E: 2.5 };
const CONTROL_NODE_TYPES = ["IfStatement"];

const flattenAST = nodes => {
	let flatNodes = [];

	nodes.forEach(node => {
		if (CONTROL_NODE_TYPES.includes(node.type)) {
			const body = deepClone(node.consequent.body);
			delete node.consequent;
			flatNodes.concat([node].concat(flattenAST(body)));
		} else flatNodes.push(node);
	});

	return flatNodes;
};

const compareFunAST = (nodes, compareNodes) => {
	console.log("Retreiving unsorted code matches");
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

	console.log("Sorting match hierarchy");
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

	return similiarity * modifier;
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
	return diffValue;
};

const countKeys = obj => JSON.stringify(obj).match(/[^\\]":/g).length;

const DETAIL_KEYS = [
	"name",
	"identifierName",
	"start",
	"end",
	"loc",
	"trailingComments",
	"leadingComments",
	"extra",
	"value"
];

const elimateNodeDetails = node => {
	if (node)
		Object.keys(node).forEach(k => {
			if (DETAIL_KEYS.includes(k)) delete node[k];
			else if (typeof node[k] === "object") elimateNodeDetails(node[k]);
		});

	return node;
};

module.exports.getDASubtrees = getDASubtrees;
