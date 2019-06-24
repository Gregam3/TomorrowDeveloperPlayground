const parser = require("@babel/parser");
const deepDiff = require("deep-diff").diff;
const deepClone = require("lodash.clonedeep");

// const FUN_NAMES = ["connect", "collect", "disconnect"];
const FUN_NAMES = ["one", "two"];

const getSimiliarity = (baseFunStr, compareFunStr) => {
	const getFlatAST = code =>
		flattenAST(
			parser
				.parse(code, {
					sourceType: "module"
				})
				//Gets the function body
				.program.body[0].body.body.map(elimateNodeDetails)
		);

	return compareFunAST(getFlatAST(baseFunStr), getFlatAST(compareFunStr));
};

const DIFF_VALUES = { D: 1, N: 1, A: 0.5, E: 0.25 };
const ALWAYS_DEEP_NODE_TYPES = [
	"IfStatement",
	"WhileStatement",
	"ForStatement",
	"DoWhileStatement",
	"FunctionDeclaration"
];

const flattenAST = nodes => {
	let flatNodes = [];

	nodes.forEach(node => {
		if (ALWAYS_DEEP_NODE_TYPES.includes(node.type)) {
			let leafNodes = extractLeafNodes(node);
			flatNodes.push(leafNodes.node);
			flatNodes.push(...flattenAST(leafNodes.body));
		} else if (node.type === "ExpressionStatement") {
			if (
				node.expression.arguments.every(
					a => a.type !== "ArrowFunctionExpression"
				)
			) {
				flatNodes.push(node);
			} else {
				let leafNodes = extractLeafNodes(node);
				flatNodes.push(leafNodes.node);
				leafNodes.body.forEach(aNode => {
					if (
						aNode.type === "ArrowFunctionExpression" &&
						aNode.body.hasOwnProperty("body")
					)
						//.body for => and .body.body for => {}
						flatNodes.push(...flattenAST(aNode.body.body));
					else flatNodes.push(aNode);
				});
			}
		} else flatNodes.push(node);
	});

	return flatNodes;
};

const extractLeafNodes = node => {
	if (node.type === "IfStatement") {
		const ifBody = node.consequent.hasOwnProperty("body")
			? deepClone(node.consequent.body)
			: [deepClone(node.consequent)];
		delete node.consequent;
		return { node, body: ifBody };
	} else if (node.type === "ExpressionStatement") {
		const arguments = deepClone(node.expression.arguments);
		delete node.expression;
		return { node, body: arguments };
	}

	const body = node.body.hasOwnProperty("body")
		? deepClone(node.body.body)
		: [deepClone(node.body)];
	delete node.body;
	return { node, body };
};

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
	return diffValue > 5 ? 5 : diffValue;
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

module.exports.getSimiliarity = getSimiliarity;
