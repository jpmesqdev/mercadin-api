import express, { Request, Response } from 'express'
import cors from 'cors'
import mysql from 'mysql'

const connection = mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'root',
  database:'mercadin-sasa'
})

interface Result {
  id: number;
  product_name: number;
  quantity: number;
  created_at: string;
  amount: number;
  payment_type: string;
}

const server = express()
server.use(express.json())
server.use(cors())

server.post('/entry', (request: Request, response: Response) => {
  const { productName, quantity, createdAt, amount, paymentType } = request.body

  const regexDate = '^(?:(?:31(\\/|-|\\.)(?:0?[13578]|1[02]|(?:Jan|Mar|May|Jul|Aug|Oct|Dec)))\\1|(?:(?:29|30)(\\/|-|\\.)(?:0?[1,3-9]|1[0-2]|(?:Jan|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))\\2))(?:(?:1[6-9]|[2-9]\\d)?\\d{2})$|^(?:29(\\/|-|\\.)(?:0?2|(?:Feb))\\3(?:(?:(?:1[6-9]|[2-9]\\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\\d|2[0-8])(\\/|-|\\.)(?:(?:0?[1-9]|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep))|(?:1[0-2]|(?:Oct|Nov|Dec)))\\4(?:(?:1[6-9]|[2-9]\\d)?\\d{2})$';

  if (productName === '' || quantity === 0 || !createdAt.match(regexDate) || amount < 0.01 || paymentType === '') {
    return response.status(400).json({error: "Dados inválidos!"})
  }
  connection.query(`SELECT * FROM entry WHERE product_name = '${productName}'`, (err, results, fields) => {
    if (results.length > 0) {
      let newResults = results.filter((current: Result) => {
        const newDate = Intl.DateTimeFormat('pt-BR').format(new Date(current.created_at)).substring(0, 3) + createdAt.substring(3, 10)

        return current.product_name === productName && current.payment_type === paymentType && newDate === createdAt
      }) 
      if (newResults.length > 0) {
        connection.query(`UPDATE entry SET quantity = ${newResults[0].quantity} + ${quantity}, amount = ${newResults[0].amount} + ${amount} WHERE product_name = '${productName}' AND payment_type = '${newResults[0].payment_type}'`)
        return response.status(201).send();
        
      }
      
      const DBCreatedAt = createdAt.replace(/["/"]/g, "-").split('-').reverse().join('-')
      connection.query(`INSERT INTO entry (product_name, quantity, created_at, amount, payment_type) VALUES ("${productName}", "${quantity}", "${DBCreatedAt}", "${amount}", "${paymentType}")`)
    }
  
    response.status(201).send();
  })

})

server.get('/entry/datalist', (request: Request, response: Response) => {
  connection.query(`SELECT DISTINCT product_name FROM entry`, (err, results, fields) => {
    if (results.length > 0) {
      return response.json(results)
    }
  })
})

server.get('/entry', (request: Request, response: Response) => {
  connection.query(`SELECT * FROM entry ORDER BY created_at DESC`, (err, results, fields) => {
    response.status(200).json({results})
  })
})

server.get('/report/daily/:date', (request: Request, response: Response) => {
  const { date } = request.params
  connection.query(`SELECT * FROM entry WHERE created_at = '${date}'`, (err, results, fields) => {
    response.status(200).json({results})
  })
})

server.get('/report/monthly/:monthNumber', (request: Request, response: Response) => {
  const { monthNumber } = request.params
  connection.query(`SELECT * FROM entry WHERE MONTH(created_at) = '${monthNumber}'`, (err, results, fields) => {
    response.status(200).json({results})
  })
})

server.get('/report/yearly/:yearNumber', (request: Request, response: Response) => {
  const { yearNumber } = request.params
  connection.query(`SELECT * FROM entry WHERE YEAR(created_at) = '${yearNumber}'`, (err, results, fields) => {
    response.status(200).json({results})
  })
})

server.get('/report/daily/total/:date', (request: Request, response: Response) => {
  const { date } = request.params;
  connection.query(`SELECT created_at, SUM(quantity) AS quantity, SUM(amount) AS amount FROM entry WHERE created_at = '${date}'`, (err, results, fields) => {
    return response.json(results);
  })
})

server.get('/report/monthly/total/:monthNumber', (request: Request, response: Response) => {
  const { monthNumber } = request.params
  connection.query(`SELECT payment_type, SUM(quantity) AS quantity, SUM(amount) AS amount FROM entry WHERE MONTH(created_at) = '${monthNumber}'`, (err, results, fields) => {
    response.status(200).json(results)
  })
})

server.get('/report/yearly/total/:yearNumber', (request: Request, response: Response) => {
  const { yearNumber } = request.params
  connection.query(`SELECT payment_type, SUM(quantity) AS quantity, SUM(amount) AS amount FROM entry WHERE YEAR(created_at) = '${yearNumber}'`, (err, results, fields) => {
    response.status(200).json(results)
  })
})

server.listen(3001)