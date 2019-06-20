const parser = require("@babel/parser");
const deepDiff = require("deep-diff").diff;
// const esprima = require("esprima")

// const FUN_NAMES = ["connect", "collect", "disconnect"];
const FUN_NAMES = ["one", "two"];

const getDASubtrees = (code) => {
    const AST = parser.parse(code, { sourceType: "module" }).program.body;

    let funASTs = [];

    AST.forEach(n => {
        // if (n.type === 'FunctionDeclaration' && FUN_NAMES.includes(n.id.name))
        //     funs[n.id.name] = elimateNodeDetails(n);
        if (n.type !== 'EmptyStatement') funASTs.push(elimateNodeDetails(n));
    });

    let totalSimiliarity = 0;

    compareFunAST(funASTs).forEach(n => totalSimiliarity += n.similiarity)

    return totalSimiliarity
    // return calculateSimiliarity(deepDiff(funs[0], funs[1]), countKeys(funs[0]));
}

const DIFF_VALUES = { D: 10, N: 10, A: 5, E: 2.5 }

const compareFunAST = (funASTs) => {
    return funASTs[0].body.body.map(n0 => {
        let bestNode = {
            similiarity: Number.MAX_VALUE,
            content: {}
        };

        funASTs[1].body.body.forEach(n1 => {
            const similiarity = calculateSimiliarity(n0, n1);
            if (similiarity < bestNode.similiarity)
                bestNode = { similiarity, content: n1 }
        })

        return bestNode;
    })
}

const calculateSimiliarity = (node1, node2) => {
    let diffValue = 0;

    const diff = deepDiff(node1, node2);
    if (diff) diff.forEach(d => diffValue += DIFF_VALUES[d.kind])
    return diffValue;
}

const countKeys = (obj) =>
    JSON.stringify(obj).match(/[^\\]":/g).length

const DETAIL_KEYS = ["name", "identifierName", "start", "end", "loc",
    "trailingComments", "leadingComments", "extra", "value"];

const elimateNodeDetails = (node) => {
    if (node)
        Object.keys(node).forEach(k => {
            if (DETAIL_KEYS.includes(k)) delete node[k];
            else if (typeof node[k] === 'object') elimateNodeDetails(node[k])
        });

    return node;
};

module.exports.getDASubtrees = getDASubtrees;