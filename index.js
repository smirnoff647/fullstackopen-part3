require('dotenv').config()
const morgan = require('morgan')
const express = require('express')
const cors = require('cors')
const app = express()

const Person = require('./models/person')

morgan.token('body', (req) => {return JSON.stringify(req.body)})


app.use(cors())
app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))
app.use(express.static('build'))


app.get('/api/persons', (request, response, next) => {
  Person.find({})
    .then(result => {
      response.json(result)
    })
    .catch(error => next(error))
})

app.get('/info', (request, response) => {
  const date =  new Date()
  Person.count({}, (err, count) => {
    response.send(`<p>Phonebook has info for ${count} people</p> <p>${date}</p>`)
  })

})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id).then(person => {
    if (person) {
      response.json(person)
    } else {
      response.status(404).end()
    }
  })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(() => response.status(204).end())
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body
  const person = new Person ({
    name: body.name,
    number: body.number,
  })
  person.save()
    .then(savedPerson => response.json(savedPerson))
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name , number } = request.body

  Person.findByIdAndUpdate(
    request.params.id,
    { name , number },
    { new: true, runValidators: true, context: 'query'  }
  )
    .then(updatedPerson => {
      console.log('new person data', updatedPerson)
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unkown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.log(error.message)
  if (error.name === 'CastError') {
    response.status(400).send({ error: 'misformatted id' })
  }
  if (error.name === 'ValidationError') {
    response.status(400).json({ error: error.message })
  }
  next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`)
})