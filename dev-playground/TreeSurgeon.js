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

	nodes.forEach(node => {
		if (DEEP_NODE_TYPES.includes(node.type))
			flatNodes.push(...processDefaultDeepNode(node, funs));
		else if (
			node.type === "ExpressionStatement" ||
			node.type === "CallExpression"
		)
			flatNodes.push(...processExpression(node, funs));
		else if (node.type === "VariableDeclaration") {
			flatNodes.push(node);
			flatNodes.push(...processDeclarations(node.declarations, funs));
		} else flatNodes.push(node);
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

const processDeclarations = (declarations, funs) => {
	let flatNodes = [];

	declarations.forEach(d => {
		if (
			d.init &&
			d.init.type === "CallExpression" &&
			Object.keys(funs).includes(d.init.callee.name)
		)
			flatNodes.push(...flattenAST(funs[d.init.callee.name].body.body, funs));
	});

	return flatNodes;
};

const processExpression = (node, funs) => {
	let flatNodes = [];

	const processFunctionCall = (name, fns) => {
		if (Object.keys(fns).includes(name)) {
			flatNodes.push(...flattenAST(fns[name].body.body, fns));
		}
	};

	if (node.type === "CallExpression") {
		processFunctionCall(node.callee.name, funs);
	} else if (
		node.expression.type === "CallExpression" &&
		node.expression.callee !== undefined
	) {
		flatNodes.push(node);
		processFunctionCall(node.expression.callee.name, funs);
	} else if (
		node.expression.arguments &&
		node.expression.arguments.filter(a => a.type !== "ArrowFunctionExpression")
			.length > 0
	) {
		let leafNodes = extractLeafNodes(node);
		flatNodes.push(leafNodes.node);
	} else {
		flatNodes.push(node);
	}

	if (node.expression && node.expression.arguments) {
		flatNodes.push(...processArguments(node.expression.arguments, funs));
	}

	return flatNodes;
};

const processArguments = (args, funs) => {
	let flatNodes = [];

	args.forEach(aNode => {
		if (
			aNode.type === "ArrowFunctionExpression" &&
			aNode.body.hasOwnProperty("body")
		)
			//.body for => and .body.body for => {}
			flatNodes.push(...flattenAST(aNode.body.body, funs));
		else if (aNode.type === "CallExpression") {
			flatNodes.push(...flattenAST([aNode], funs));
		} else flatNodes.push(aNode);
	});

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

const eliminateLoggingNodes = nodes => {
	const isBasicOrNewLog = node =>
		node.expression.callee &&
		node.expression.callee.property &&
		node.expression.callee.property.name === "log";

	const isOldLog = node =>
		node.expression &&
		node.expression.callee &&
		node.expression.callee.name &&
		node.expression.callee.name.startsWith("log");

	return nodes.filter(
		n =>
			n.type !== "ExpressionStatement" || (!isBasicOrNewLog(n) && !isOldLog(n))
	);
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
module.exports.eliminateLoggingNodes = eliminateLoggingNodes;
