const parser = require("@babel/parser");
const deepDiff = require("deep-diff").diff;
const esprima = require("esprima")

// const FUN_NAMES = ["connect", "collect", "disconnect"];
const FUN_NAMES = ["one", "two"];

const getDASubtrees = (code) => {
    const AST = parser.parse(code, { sourceType: "module" }).program.body;
    let funs = {};

    AST.forEach(n => {
        if (n.type === 'FunctionDeclaration' && FUN_NAMES.includes(n.id.name))
            funs[n.id.name] = elimateNodeDetails(n);
    });

    // return funs;
    // return deepDiff(funs.one, funs.two)
    // return calculateNominalDiffValue(deepDiff(funs.one, funs.two));
}

const DIFF_VALUES = { D: 10, N: 10, A: 5, E: 2.5 }

const calculateNominalDiffValue = (diff) => {
    let diffValue = 0;
    //TODO replace with .reduce
    if (diff) diff.forEach(d => diffValue += DIFF_VALUES[d.kind])
    return diffValue;
}


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