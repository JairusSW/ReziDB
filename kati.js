// Stringify function
// Pre-alloc in memory. (faster)
const nullVal = `null`;
// Precompile regular expressions
const reQuote = /\"/g;
// Much faster if functions are split up by types.
function fromString(data) {
    // Catch a bug.
    if (data.includes(`"`)) {
        // Need replaceAll. Figure this out later.
        return `"${data.replace(reQuote, '\\"')}"`;
    }
    return `"${data}"`;
}

function fromNumber(data) {
    return `${data}`;
}

const fromArray = (data) => {
    if (data.length === 0) {
        return "[]";
    }

    let result = "[";
    // Just loop through all the chunks and stringify them.
    const lastChunk = data[data.length - 1];
    let chunk;
    let i = 0;
    for (; i < data.length - 1; i++) {
        chunk = data[i];
        result += `${stringify(chunk)},`;
    }

    result += `${stringify(lastChunk)}]`;
    // += is (slightly) faster than array.push/join!
    return result;
};

const fromObject = (data) => {
    const keys = Object.keys(data);
    if (keys.length === 0) {
        return "{}";
    }
    let result = "{";
    const lastKey = keys[keys.length - 1];
    // Just loop through all the keys and stringify them.
    let key;
    for (let i = 0; i < keys.length - 1; i++) {
        key = keys[i]
        // Iterate through all but the last. (To keep the commas clean)
        result += `${stringify(key)}:${stringify(data[key])},`;
    }
    result += `${stringify(lastKey)}:${stringify(data[lastKey])}}`;

    return result;
};

function stringify(data) {
    if (typeof data === "string") {
        return fromString(data);
    } else if (Number.isFinite(data)) {
        return fromNumber(data);
    } else if (isArrayish(data)) {
        return fromArray(data);
    } else if (data instanceof Object) {
        return fromObject(data);
    } else if (data === true || data === false) {
        return data ? `true` : `false`;
    } else {
        return nullVal;
    }
}

function isArrayish(obj) {
    if (!obj) {
        return false;
    }
    return (
        obj instanceof Array ||
        Array.isArray(obj) ||
        (obj.length >= 0 && obj.splice instanceof Function)
    );
}

module.exports = {
    stringify: stringify,
    parse: JSON.parse
}