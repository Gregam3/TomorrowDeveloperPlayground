const deepClone = require("lodash.clonedeep");

const ALWAYS_DEEP_NODE_TYPES = [
	"IfStatement",
	"WhileStatement",
	"ForStatement",
	"DoWhileStatement",
	"FunctionDeclaration"
];

const flattenAST = (nodes, funs) => {
	let flatNodes = [];

	nodes.forEach(node => {
		if (ALWAYS_DEEP_NODE_TYPES.includes(node.type)) {
			let leafNodes = extractLeafNodes(node);
			flatNodes.push(leafNodes.node);
			flatNodes.push(...flattenAST(leafNodes.body));
		} else if (node.type === "ExpressionStatement") {
			if (
				!node.expression.arguments ||
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
		const args = deepClone(node.expression.arguments);
		delete node.expression;
		return { node, body: args };
	}

	const body = node.body.hasOwnProperty("body")
		? deepClone(node.body.body)
		: [deepClone(node.body)];
	delete node.body;
	return { node, body };
};

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

module.exports.flattenAST = flattenAST;
module.exports.elimateNodeDetails = elimateNodeDetails;
