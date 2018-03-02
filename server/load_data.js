const fs = require('fs')
const path = require('path')
const esConnection = require('./connection')


function parseBookFile (filePath) {
    const book = fs.readFileSync(filePath, 'utf8')


const title = book.match(/^CASE:\s(.+)$/m)[1]
const caseNo = book.match(/^No.\s(.+)$/m)

console.log(`Reading - ${title}`)




const startOfBookMatch = book.match(/^----------/m)
const startOfBookIndex = startOfBookMatch.index + startOfBookMatch[0].length
const endOfBookIndex = book.match(/^%%%/m).index

const paragraphs = book
    .slice(startOfBookIndex, endOfBookIndex)
    .split(/\n\s+\n/g) // Split each paragraph into it's own array entry
    .map(line => line.replace(/\r\n/g, ' ').trim()) // Remove paragraph line breaks and whitespace
    .filter((line) => (line && line !== '')) // Remove empty lines
  
console.log(`Parsed ${paragraphs.length} Paragraphs\n`)
return { title, paragraphs }
  }

async function insertBookData (title, caseNo, paragraphs) {
    let bulkOps = []

    for (let i = 0; i < paragraphs.length; i++) {
        bulkOps.push({ index: { _index: esConnection.index, _type: esConnection.type } })
    
    bulkOps.push({
      caseNo,
      title,
      text: paragraphs[i]
    })
    
    if (i > 0 && i % 500 === 0) { 
        await esConnection.client.bulk({ body: bulkOps })
        bulkOps = []
        console.log(`Indexed Paragraphs  ${i - 499}  - ${i}`)
      }
    }
  
 
    await esConnection.client.bulk({ body: bulkOps })
    console.log(`Indexed Paragraphs  ${paragraphs.length - (bulkOps.length / 2)}  - ${paragraphs.length}\n\n\n`)
  }

async function readAndInsertBooks () {
    await esConnection.checkConnection()

    try {
        await esConnection.resetIndex()

        let files = fs.readdirSync('./books').filter(file => file.slice(-4) === '.txt')
        console.log(`Found ${files.length} File`)

        for (let file of files) {
            console.log(`Reading file -  ${file}`)
            const filePath = path.join('./books', file)
            const {title, paragraphs} = parseBookFile(filePath)
            await insertBookData(title, paragraphs)
        }
    } catch (err) {
        console.error(err)
    }
}
 
   

  readAndInsertBooks()
