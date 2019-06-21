const parser = require("@babel/parser");
const deepDiff = require("deep-diff").diff;

// const FUN_NAMES = ["connect", "collect", "disconnect"];
const FUN_NAMES = ["one", "two"];

const getDASubtrees = code => {
	const AST = parser.parse(code, { sourceType: "module" }).program.body;

	let funASTs = [];

	AST.forEach(n => {
		// if (n.type === 'FunctionDeclaration' && FUN_NAMES.includes(n.id.name))
		//     funs[n.id.name] = elimateNodeDetails(n);
		if (n.type !== "EmptyStatement") funASTs.push(elimateNodeDetails(n));
	});

	return compareFunAST(funASTs[0], funASTs[1]);
};

const DIFF_VALUES = { D: 10, N: 10, A: 5, E: 2.5 };

const compareFunAST = (nodes, compareNodes) => {
	//body.body takes the body of the block statement following a function (i.e. all nodes inside)
	const childNodes = nodes.body.body;

	console.log("Retreiving unsorted code matches");
	//new Array used to retrieve range to map
	let matches = [...Array(childNodes.length).keys()].map(node => {
		return {
			node: childNodes[node],
			comparisons: [...Array(compareNodes.length).keys()].map(compareIndex => {
				return {
					similiarity: calculateSimiliarity(
						childNodes[node],
						compareNodes[compareIndex]
					),
					compareIndex
				};
			})
		};
	});

	return matches;

	//Sort Comparison hiearchies inside of each line
	let nodeMatches = matches.map(match =>
		match.sort((l, r) => l.similiarity.localeCompare(r.similiarity))
	);

	//Eliminate duplicate matches
	nodeMatches = new Array(matches.length).map(i => {
		let compareMatch = compareMatch(
			matches[i].comparisons[0].compareIndex,
			nodeMatches
		);
		while (compareMatch.compare !== 0) {
			if (compareMatch.compare === 1) matches[i].comparisons.shift();
			else matches[compareMatch.index].shift();

			compareMatch = compareMatch(
				matches[i].comparisons[0].compareIndex,
				nodeMatches
			);
		}
	});

	let modifier =
		nodeMatches.filter(match => match.comparisons.length === 0).length * 0.5;
	//To use 1 as a base, cannot be set before incase filter yields 0
	modifier++;

	let similiarity = 0;

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
	if (!matches[index]) return { index: -1, compare: 0 };

	for (let i = 0; i < matches.length; i++)
		if (
			matches[index].comparisons[0].compareIndex ===
				matches[i].comparisons[0].compareIndex &&
			index !== i
		)
			return {
				index: i,
				compare:
					matches[index].comparisons[0].similiarity >
					matches[i].comparisons[0].similiarity
						? 1
						: -1
			};

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
