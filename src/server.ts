import express, { Request, Response } from 'express'
import cors from 'cors'
import mysql from 'mysql'

const connection = mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'root',
  database:'mercadin-sasa'
})


const server = express()
server.use(express.json())
server.use(cors())

server.post('/entry', (request: Request, response: Response) => {
  const { productName, quantity, createdAt, amount, paymentType } = request.body

  const regexDate = '^(?:(?:1[6-9]|[2-9]\\d)?\\d{2})(?:(?:(\\/|-|\\.)(?:0?[13578]|1[02])\\1(?:31))|(?:(\\/|-|\\.)(?:0?[13-9]|1[0-2])\\2(?:29|30)))$|^(?:(?:(?:1[6-9]|[2-9]\\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(\\/|-|\\.)0?2\\3(?:29)$|^(?:(?:1[6-9]|[2-9]\\d)?\\d{2})(\\/|-|\\.)(?:(?:0?[1-9])|(?:1[0-2]))\\4(?:0?[1-9]|1\\d|2[0-8])$';

  if (productName === '' || quantity === 0 || !createdAt.match(regexDate) || amount < 0.01 || paymentType === '') {
    return response.status(400).json({error: "Dados inválidos!"})
  }
  connection.query(`INSERT INTO entry (product_name, quantity, created_at, amount, payment_type) VALUES ("${productName}", "${quantity}", "${createdAt}", "${amount}", "${paymentType}")`)

  response.status(201).send();

})

server.get('/entry', (request: Request, response: Response) => {
  connection.query(`SELECT * FROM entry`, (err, results, fields) => {
    response.status(200).json({results})
  })
})

server.get('/report/daily/:date/:paymentType', (request: Request, response: Response) => {
  const { date, paymentType } = request.params
  connection.query(`SELECT created_at, payment_type, SUM(quantity) AS total_quantity, SUM(amount) AS total_amount FROM entry WHERE created_at = '${date}' AND payment_type = '${paymentType}' `, (err, results, fields) => {
    response.status(200).json({results})
  })
})

server.get('/report/monthly/:date1/:date2/:paymentType', (request: Request, response: Response) => {
  const { date1, date2, paymentType } = request.params
  connection.query(`SELECT payment_type, SUM(quantity) AS total_quantity, SUM(amount) AS total_amount FROM entry WHERE (created_at BETWEEN '${date1}' AND '${date2}') AND payment_type = '${paymentType}' `, (err, results, fields) => {
    response.status(200).json({results})
  })
})


server.listen(3001)