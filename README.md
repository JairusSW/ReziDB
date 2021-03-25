# ReziDB
**An Mighty Database Based On LevelDB**

## Features
- Sharding Support
- Based On LevelDB
- Works In Multiple Processes
- Small and Fast
- Works With Buffers

## Installation

```bash
~ npm install rezidb
```

## Usage

```js
const ReziDB = require('rezidb')

const db = new ReziDB({
    name: 'Test',
    path: './data',
    cluster: false
})

await db.set('Hello', 'World 🌎')

console.log(await db.get('Hello'))

console.log('Data: ', await db.toJSON())
```

## API

**new ReziDB()**

Construct a new ReziDB instance. Can Be Clustered.

**db.set(key, value, path) -->> null**

Set a key and a value with an optional path

**db.setStream(key, stream, path) -->> null**

Set a key and a stream. Has an optional path.

**db.setStreamBuffer(key, stream, path) -->> null**

Set a key and a stream as a buffer. Has an optional path.

**db.ensure(key, value) -->> null**

If the database does not have it, set it.

**db.get(key, path) -->> any**

Get data from the database. Also has a path option.

**db.getStream(key, path) -->> ReadableStream**

Get data from the database as a stream. Also has a path option.

**db.has(key, path) -->> boolean**

Check if the database has a key. Also has a path option.

**db.delete(key) -->> null**

Delete a key from the database.

**db.clear() -->> null**

Clear the whole database

**db.observe(key, path) -->> object**

Returns an object that will save to the database on change.

**db.push(key, value, path) -->> null**

Push data to the provided array. Also has a path option.

**db.splice(key, position, path) -->> null**

Splice data in the provided array. Also has a path option.

**db.shift(key, path) -->> null**

Shift data in the provided array. Also has a path option.

**db.unshift(key, items, path) -->> null**

Unshift data in the provided array. Also has a path option.

**db.includes(key, value, path) -->> boolean**

Check if the provided array or string includes a value. Also has a path option.

**db.pop(key, path) -->> null**

Pop data from the provided array. Also has a path option.

**db.batch() -->> Batch**

Create a batch constructor. Can be called to write data very fast.

**db.keys() -->> Array**

Get all of the keys in the database.

**db.values() -->> Array**

Get all of the values in the database.

**db.entries() -->> Array**

Get all of the entries in the database.

**db.forEach(callback) -->> null**

Iterate through all of the keys and values of the database.

**db.random() -->> object**

Get a random key and value from the database.

**db.find(callback) -->> any**

Find a key or value in the database. Similar to array.find().

**db.filter(callback) -->> any**

Find a key or value in the database. Similar to array.filter().

**db.search(query) -->> Array**

Search the whole database for a query. 

**db.size() -->> number**

Get the size of the database.

**db.toJSON() -->> object**

Get the whole database as a JSON object.

**db.toArray() -->> Array**

Get the whole database as an Array.