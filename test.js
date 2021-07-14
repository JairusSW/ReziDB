(async () => {
    const ReziDB = require(".")
    const db = new ReziDB({
        name: 'test1',
        cluster: false,
        cache: {
            maxSize: 1000
        }
    })
    await db.clear()
    await db.set('haha', ['baba',['mama', 12345,{haha:'hoho'}]])
    console.log(await db.get('haha'))
})()