const Benchmark = require('benchmark');

const suite = new Benchmark.Suite;

const ReziDB = require(".")
const db = new ReziDB({
    name: 'bench',
    cluster: false,
    cache: {
        maxSize: 1000
    }
})

suite.add('Set', async function () {
    await db.set(1, 2)
})
suite.add('Get', async function () {
    await db.get(1)
})
suite.add('Has', async function () {
    await db.has(1)
})
suite.on('cycle', function (event) {
    console.log(String(event.target));
})
suite.on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})

db.clear().then(() => {
    suite.run({async: true});
})