const elasticsearch = require('elasticsearch')


const index = 'library'
const type = 'novel'
const port = 9200
const host = process.env.ES_HOST || 'localhost'
const client = new elasticsearch.Client({ host: {host, port} })

async function checkConnection () {
    let isConnected = false
    while (!isConnected) {
        console.log('Connecting to ES')
        try {
            const health = await client.cluster.health({})
            console.log(health)
            isConnected = true
        }   catch (err) {
            console.log('Connection Failed, retrying...', err)
        
        }
    }
}
async function resetIndex () {
    if (await client.indeces.exists({index})) {
        await client.indeces.delete({index})
    }
    await client.indeces.create({index})
    await putBookMapping()
}

async function putBookMapping() {
    const schema = {
        case: {type: 'keyword'},
        ind:  {type: 'integer'},
        date: {type: 'date'},
        doc: {type: 'keyword'},
        atty: {type: 'keyword'},
        location: {type: 'keyword'},
        text: {type: 'text'}
    }
    return client.indices.putMapping({index, type, body:{properties: schema}})
}

module.exports = {
    client, index, type, checkConnection, resetIndex
}