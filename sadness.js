const o = {
    some: 123,
    toString: function() { return `Some: ${this.some}`; },
}

// reference error
function kek({ o = o } = {}) {
    console.log(o);
}

// nor this works
const mek = ({ o = o } = {}) => {
    console.log(o);
}

kek()
mek();