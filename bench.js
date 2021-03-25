const b = require('benny')

const ReziDB = require('./')

const db = new ReziDB({
    name: 'test4',
    cluster: false
})

b.suite('ReziDB', 
    b.add('set', async () => {
        return async () => { return await db.set('haha', 'baba') }
    }),
    b.add('get', async () => {
        return async () => { return await db.get('haha') }
    }),
    b.add('has', async () => {
        return async () => { return await db.has('haha') }
    }),
    b.cycle(),
    b.save({ file: 'reduce', format: 'chart.html' })
)

