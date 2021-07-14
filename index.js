let Level = require('level')
const { existsSync, mkdirSync } = require('fs')
const kati = require('./kati')
const onChange = require('on-change')
const getStream = require('get-stream')
const toStream = require('into-stream')
const {
    get: _get,
    set: _set,
    isArray: _isArray,
    isString: _isString,
    isObject: _isObject,
    isNumber: _isNumber
} = require('lodash')
const QuickLRU = require('quick-lru')
const isNil = (data) => {
    return data == null
}
class ReziDB {
    constructor(options = {
        name: '',
        path: '',
        cluster: true,
        cache: {
            maxSize: 1000
        }
    }) {
        if (isNil(options.name)) throw new Error('No Name Provided')
        if (isNil(options.path)) options.path = './data/'
        if (isNil(options.cluster)) options.cluster = false
        if (options.cluster === true) Level = require('level-party')
        if (!existsSync(options['path'])) mkdirSync(options['path'])
        if (!existsSync(`${options['path']}/${options['name']}`)) mkdirSync(`${options['path']}/${options['name']}`)
        this.database = Level(`${options['path']}/${options['name']}`, {
            keyEncoding: 'utf8',
            valueEncoding: 'utf8'
        })
        this.cacheOn = options.cache ? true : false        
        this.cache = new QuickLRU({ maxSize: 1000 })
        if (options['cache']) {
            if (options['cache'] === true) {
            } else if (options['cache']['maxSize']) {
                this.cache = new QuickLRU({ maxSize: options['cache']['maxSize'] })
            }
        }
    }
    /**
    * Set A Key/Value If It Is Missing
    * ```js 
    * await db.ensure('key', 'value')
    * ```
    * @license Apache-2.0
    * @returns undefined
    * @author JairusSW
    */
    async ensure(key, value) {
        try {
            await this.set(key, value)
            return
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Set A Key/Value Inside Of The Database
    * ```js 
    * await db.set(key, value, path)
    * ```
    * @license Apache-2.0
    * @returns undefined
    * @author JairusSW
    */
    async set(key, value, path) {
        try {
            if (path) {
                let data = await this.get(key) || undefined
                if (data === undefined) data = {}
                _set(data, path.toString(), value)
                if (this.cacheOn === true) this.cache.set(key, data)
                await this.database.put(key, data)
                return
            }
            if (this.cacheOn === true) this.cache.set(key, value)
            await this.database.put(key, value)
            return
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Set A Key/Value Inside Of The Database Via A Stream
    * ```js 
    * await db.setStream(key, stream, path)
    * ```
    * @license Apache-2.0
    * @returns undefined
    * @author JairusSW
    */
    async setStream(key, stream, path) {
        try {
            let value = await getStream(stream)
            this.set(key, value, path)
            return
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Get A Key/Value From The Database
    * ```js 
    * await db.get(key, path)
    * ```
    * @license Apache-2.0
    * @returns any
    * @author JairusSW
    */
    async get(key, path) {
        try {
            if (path) {
                let data
                if (this.cacheOn === true && this.cache.has(key)) return _get(this.cache.get(key), path.toString())
                data = await this.database.get(key)
                return _get(data, path.toString())
            }
            if (this.cacheOn === true && this.cache.has(key)) return this.cache.get(key)
            return await this.database.get(key)
        } catch {
            return undefined
        }
    }
    /**
    * Get A Key/Value As A Stream From The Database
    * ```js 
    * await db.getStram(key, path)
    * ```
    * @license Apache-2.0
    * @returns Stream
    * @author JairusSW
    */
    async getStream(key, path) {
        try {
            if (path) {
                let data
                data = await this.database.get(key)
                if (this.cache.has(key)) return toStream(_get(this.cache.get(key), path.toString()))
                return toStream(_get(data, path.toString()))
            }
            if (this.cache.has(key)) return toStream(this.cache.get(key))
            return toStream(await this.database.get(key))
        } catch {
            return undefined
        }
    }
    /**
    * Check If Key/Value Exists
    * ```js 
    * await db.has(key, path)
    * ```
    * @license Apache-2.0
    * @returns true/false
    * @author JairusSW
    */
    async has(key, path) {
        try {
            if (this.cache.has(key)) return true
            const data = await this.get(key, path)
            if (data == false) return false
            return true
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Delete A Key From The Database
    * ```js 
    * await db.delete(key)
    * ```
    * @license Apache-2.0
    * @returns undefined
    * @author JairusSW
    */
    async delete(key) {
        try {
            if (this.cache.has(key)) return this.cache.delete(key)
            await this.database.del(key)
            return
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Clear The Whole Database
    * ```js 
    * await db.clear()
    * ```
    * @license Apache-2.0
    * @returns undefined
    * @author JairusSW
    */
    async clear() {
        try {
            if (this.cache) this.cache.clear()
            return await this.database.clear()
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Return Data To Watch. Data That Is Edited Is Synced With The Database. Only Works With Array and Object.
    * ```js 
    * await db.observe(key, path)
    * ```
    * @license Apache-2.0
    * @returns any
    * @author JairusSW
    */
    async observe(key, path) {
        try {
            let proxy
            const data = await this.get(key, path)
            if (!data) return
            proxy = onChange(data, async (k, v) => {
                if (path) return await this.set(key, v, `${path}.${k}`)
                await this.set(key, v, k)
            })
            return proxy
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Push A Value Into An Array
    * ```js 
    * await db.push(key, value, path)
    * ```
    * @license Apache-2.0
    * @returns undefined
    * @author JairusSW
    */
    async push(key, value, path) {
        try {
            const data = await this.get(key, path)
            if (!_isArray(data)) return undefined
            data.push(value)
            await this.set(key, data, path)
            return
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Splice An Array
    * ```js 
    * await db.splice(key, position, path)
    * ```
    * @license Apache-2.0
    * @returns undefined
    * @author JairusSW
    */
    async splice(key, position, path) {
        try {
            const data = await this.get(key, path)
            if (!_isArray(data)) return undefined
            data.splice(position, 1)
            await this.set(key, data, path)
            return
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Shift An Array
    * ```js 
    * await db.shift(key, path)
    * ```
    * @license Apache-2.0
    * @returns undefined
    * @author JairusSW
    */
    async shift(key, path) {
        try {
            const data = await this.get(key, path)
            if (!_isArray(data)) return undefined
            data.shift()
            await this.set(key, data, path)
            return
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Un-Shift An Array
    * ```js 
    * await db.unshift(key, items, path)
    * ```
    * @license Apache-2.0
    * @returns undefined
    * @author JairusSW
    */
    async unshift(key, items, path) {
        try {
            const data = await this.get(key, path)
            if (!_isArray(data)) return undefined
            data.unshift(items)
            await this.set(key, data, path)
            return
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Check If Array Or String Includes
    * ```js 
    * await db.includes(key, value, path)
    * ```
    * @license Apache-2.0
    * @returns true/false
    * @author JairusSW
    */
    async includes(key, value, path) {
        try {
            const data = await this.get(key, path)
            if (!_isArray(data) && !_isString(data)) return false
            return data.includes(value)
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Pop An Array
    * ```js 
    * await db.pop(key, path)
    * ```
    * @license Apache-2.0
    * @returns undefined
    * @author JairusSW
    */
    async pop(key, path) {
        try {
            const data = await this.get(key, path)
            if (!_isArray(data)) return undefined
            data.pop()
            await this.set(key, data, path)
            return
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Batch Jobs Sequentially
    * ```js 
    * await db.batch([
    *  { type: 'set', key: 'key', value: 'value' }
    * ])
    * 
    * ```
    * @license Apache-2.0
    * @returns undefined
    * @author JairusSW
    */
    async batch() {
        try {
            const batch = await this.database.batch()
            return {
                set: async (key, value, path) => {
                    if (this.cache) this.cache.set(key, value)
                    if (path) {
                        let data = await this.get(key) || undefined
                        if (data === undefined) data = {}
                        _set(data, path.toString(), value)
                        if (this.cache) this.cache.set(key, data)
                        batch.put(key, data)
                        return
                    }
                    batch.put(key, value)
                },
                delete: async (key) => {
                    if (this.cache) this.cache.delete(key)
                    batch.del(key)
                },
                write: async () => {
                    return new Promise((resolve, reject) => {
                        batch.write(() => {
                            resolve()
                        })
                    })
                }
            }
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Return All The Keys In The Database As An Array
    * ```js 
    * await db.keys()
    * ```
    * @license Apache-2.0
    * @returns []
    * @author JairusSW
    */
    async keys() {
        try {
            return new Promise((resolve, reject) => {
                const keys = []
                this.database.createKeyStream()
                    .on('data', (key) => {
                        keys.push(key)
                    })
                    .on('error', (err) => {
                        reject(err)
                    })
                    .on('close', () => {
                        resolve(keys)
                    })
            })
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Return All The Values In The Database As An Array
    * ```js 
    * await db.values()
    * ```
    * @license Apache-2.0
    * @returns []
    * @author JairusSW
    */
    async values() {
        try {
            return new Promise((resolve, reject) => {
                const values = []
                this.database.createValueStream()
                    .on('data', (value) => {
                        values.push(value)
                    })
                    .on('error', (err) => {
                        reject(err)
                    })
                    .on('close', () => {
                        resolve(values)
                    })
            })
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Return All The Data In The Database As An Iterable
    * ```js 
    * await db.entries()
    * ```
    * @license Apache-2.0
    * @returns []
    * @author JairusSW
    */
    async entries() {
        try {
            return new Promise((resolve, reject) => {
                let entries = []
                this.database.createReadStream({ keys: true, values: true })
                    .on('data', ({ key, value }) => {
                        entries.push([key, value])
                    })
                    .on('error', (err) => {
                        reject(err)
                    })
                    .on('close', () => {
                        resolve(entries)
                    })
            })
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Return All The Keys And Values One At A Time
    * ```js 
    * await db.forEach((key, value) => {})
    * ```
    * @license Apache-2.0
    * @returns undefined
    * @author JairusSW
    */
    async forEach(callback) {
        try {
            const stream = this.database.createReadStream({ keys: true, values: true })
            stream.on('data', ({ key, value }) => {
                callback(key, value)
            })
            stream.on('error', (err) => {
                reject(err)
            })
            stream.on('close', () => { })
            return
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Return A Random Key/Value From The Database
    * ```js 
    * await db.random()
    * ```
    * @license Apache-2.0
    * @returns {}
    * @author JairusSW
    */
    async random() {
        try {
            const array = await this.keys()
            const random = array[(Math.random() * array.length) | 0]
            const json = {}
            json[random] = await this.get(random)
            return json
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Find A Key Or Value In The Database
    * ```js 
    * await db.find((value, key) => value === 'value')
    * ```
    * @license Apache-2.0
    * @returns {}
    * @author JairusSW
    */
    async find(callback) {
        try {
            return new Promise((resolve, reject) => {
                let found = false
                const json = {}
                const stream = this.database.createReadStream({ keys: true, values: true })
                stream.on('data', ({ key, value }) => {
                    if (callback(value, key)) {
                        found = true
                        const json = {}
                        json[key] = value
                        stream.destroy()
                        return resolve(json)
                    }
                })
                stream.on('error', (err) => {
                    reject(err)
                })
                stream.on('close', () => {
                    if (found === false) {
                        return resolve(json)
                    }
                })
            })
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Filter Key(s) Or Value(s) From The Database
    * ```js 
    * await db.filter((value, key) => value === 'value')
    * ```
    * @license Apache-2.0
    * @returns {}
    * @author JairusSW
    */
    async filter(callback) {
        try {
            return new Promise((resolve, reject) => {
                let found = false
                const json = {}
                const stream = this.database.createReadStream({ keys: true, values: true })
                stream.on('data', ({ key, value }) => {
                    if (callback(value, key)) {
                        found = true
                        const json = {}
                        json[key] = value
                        stream.destroy()
                        return resolve(json)
                    }
                })
                stream.on('error', (err) => {
                    reject(err)
                })
                stream.on('close', () => {
                    if (found === false) {
                        return resolve(json)
                    }
                })
            })
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Search The Database For A List Of Results
    * ```js 
    * await db.search(query)
    * ```
    * @license Apache-2.0
    * @returns []
    * @author JairusSW
    */
    async search(query, count) {
        try {
            return new Promise((resolve, reject) => {
                const stream = this.database.createReadStream({ keys: true, values: true })
                let array = []
                let done = false
                stream.on('data', ({ key, value }) => {
                    let json = {}
                    if (key.includes(query)) {
                        json[key] = value
                        array.push(json)
                        if (count && array.length + 1 > count) {
                            done = true
                            stream.destroy()
                            return resolve(array)
                        }
                        return
                    }
                    if (JSON.stringify(value).includes(query)) {
                        json[key] = value
                        array.push(json)
                        if (count && array.length + 1 > count) {
                            done = true
                            stream.destroy()
                            return resolve(array)
                        }
                        return
                    }
                })
                stream.on('error', (err) => {
                    reject(err)
                })
                stream.on('close', () => {
                    if (done === true) return
                    return resolve(array)
                })
            })
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Get The Database Column Size
    * ```js 
    * await db.size()
    * ```
    * @license Apache-2.0
    * @returns {}
    * @author JairusSW
    */
    async size() {
        try {
            return new Promise((resolve, reject) => {
                let size = 0
                this.database.createKeyStream({ keys: false, values: false })
                    .on('data', () => {
                        size++
                    })
                    .on('error', (err) => {
                        reject(err)
                    })
                    .on('close', () => {
                        resolve(size)
                    })
            })
        } catch (err) {
            throw new Error(err)
        }
    }
    /**
    * Return The Database As JSON
    * ```js 
    * await db.toJSON()
    * ```
    * @license Apache-2.0
    * @returns {}
    * @author JairusSW
    */
    async toJSON() {
        try {
            return new Promise((resolve, reject) => {
                const json = {}
                this.database.createReadStream({ keys: true, values: true })
                    .on('data', ({ key, value }) => {
                        json[key] = value
                    })
                    .on('error', (err) => {
                        reject(err)
                    })
                    .on('close', () => {
                        resolve(json)
                    })
            })
        } catch (err) {
            throw new Error(err)
        }
    }
    async toArray() {
        try {
            return new Promise((resolve, reject) => {
                const array = []
                this.database.createReadStream({ keys: true, values: true })
                    .on('data', ({ key, value }) => {
                        array.push([key, value])
                    })
                    .on('error', (err) => {
                        reject(err)
                    })
                    .on('close', () => {
                        resolve(array)
                    })
            })
        } catch (err) {
            throw new Error(err)
        }
    }
}
module.exports = ReziDB