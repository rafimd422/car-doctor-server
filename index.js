const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sopxnju.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const database = client.db('car-doctor');
    const serviceCollection = database.collection("services");
    const bookingCollection = database.collection("bookings");


    app.get('/services', async(req,res) => {
        const cursor =  serviceCollection.find()
const result = await cursor.toArray()
        res.send(result)
    });

app.get('/services/:id', async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  console.log(query)
  const result = await serviceCollection.findOne(query)
  res.send(result)
})

//bookings

app.post('/booking',async (req,res)=>{
  const service = req.body;
  console.log(service)
  const result = await bookingCollection.insertOne(service)
res.send(result)
})

app.get('/booking', async (req,res) => {
  let query = {}
  if(req.query?.email){
    query = {email: req.query.email}
  }
  const result = await bookingCollection.find(query).toArray()
  res.send(result)
})

app.delete('/booking/:id', async(req,res)=>{
  const id = req.params.id;
const query = {_id: new ObjectId(id)}
const result = await bookingCollection.deleteOne(query)
res.send(result)
})


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Server is Running...')
})


app.listen(port, () => {
  console.log(`Car doctor server is runnig on port ${port}`)
})