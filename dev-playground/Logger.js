let logs = [];

const log = (level, msg) => logs.push({ level, msg })

const popLogs = () => {
    const tempLogs = logs;
    logs = [];
    return tempLogs;
}

module.exports.log = log;
module.exports.popLogs = popLogs;