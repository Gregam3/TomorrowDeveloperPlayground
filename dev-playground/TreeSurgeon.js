const deepClone = require("lodash.clonedeep");

const DEEP_NODE_TYPES = [
	"IfStatement",
	"WhileStatement",
	"ForStatement",
	"DoWhileStatement",
	"FunctionDeclaration"
];

//CallExpression
//expression.callee.name

const flattenAST = (nodes, funs) => {
	let flatNodes = [];

	//TODO simplify
	nodes.forEach(node => {
		if (DEEP_NODE_TYPES.includes(node.type)) processDefaultDeepNode(node, funs);
		else if (node.type === "ExpressionStatement") processExpression(node, funs);
		else flatNodes.push(node);
	});

	return flatNodes;
};

const processDefaultDeepNode = (node, funs) => {
	let flatNodes = [];

	let leafNodes = extractLeafNodes(node);
	flatNodes.push(leafNodes.node);
	flatNodes.push(...flattenAST(leafNodes.body, funs));

	return flatNodes;
};

const processExpression = (node, funs) => {
	let flatNodes = [];

	if (
		node.expression.type === "CallExpression" &&
		node.expression.callee !== undefined
	) {
		if (Object.keys(funs).includes(node.expression.callee.name))
			flatNodes.push(
				...flattenAST(funs[node.expression.callee.name].body.body, funs)
			);
		else flatNodes.push(node);
	} else if (
		!node.expression.arguments ||
		node.expression.arguments.every(a => a.type !== "ArrowFunctionExpression")
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
				flatNodes.push(...flattenAST(aNode.body.body, funs));
			else flatNodes.push(aNode);
		});
	}
	return flatNodes;
};

const extractLeafNodes = node => {
	if (node.type === "IfStatement" && node.consequent) {
		const ifBody = node.consequent.hasOwnProperty("body")
			? deepClone(node.consequent.body)
			: [deepClone(node.consequent)];
		delete node.consequent;
		return { node, body: ifBody };
	} else if (node.type === "ExpressionStatement") {
		const args = deepClone(node.expression.arguments);
		delete node.expression;
		return { node, body: args };
	} else if (node.body) {
		const body = node.body.hasOwnProperty("body")
			? deepClone(node.body.body)
			: [deepClone(node.body)];
		delete node.body;
		return { node, body };
	}

	return { node, body: [] };
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

const eliminateNodeDetails = node => {
	if (node)
		Object.keys(node).forEach(k => {
			if (DETAIL_KEYS.includes(k)) delete node[k];
			else if (typeof node[k] === "object") eliminateNodeDetails(node[k]);
		});

	return node;
};

module.exports.flattenAST = flattenAST;
module.exports.eliminateNodeDetails = eliminateNodeDetails;
