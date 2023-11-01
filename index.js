const express = require("express");
var jwt = require("jsonwebtoken");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 4000;


const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log('token', token)
  if(!token){
    return res.status(401).send({message: 'unauthorized'})
  }
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded)=>{
if(err){
  return res.status(401).send({message:'unauthorized access'})
}console.log('value in the token', decoded)
req.user = decoded;
next()
})
}
const logger = (req, res, next) =>{
  console.log('log: info', req.url);
  next();
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sopxnju.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const database = client.db("car-doctor");
    const serviceCollection = database.collection("services");
    const bookingCollection = database.collection("bookings");

    // auth relelted api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: "10h" });
      
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
      });
      res.send("Success");
    });
    

    // service releted api
    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    //bookings

    app.post("/booking", async (req, res) => {
      const service = req.body;
      console.log(service);
      const result = await bookingCollection.insertOne(service);
      res.send(result);
    });

    app.get("/booking",logger,verifyToken , async (req, res) => {

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }   

console.log(req.user.user.email, req.query.email)

      if(req.query?.email !== req.user?.user.email){
           return  res.status(403).send({message:'forbidden access'})
        }

      console.log(req.cookies.token)
      const result = await bookingCollection.find(query).toArray();

      res.send(result);
    });

    app.patch("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const booking = req.body;

      const updateBooking = {
        $set: {
          status: booking.status,
        },
      };
      const result = await bookingCollection.updateOne(filter, updateBooking);
      res.send(result);
    });

    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is Running...");
});

app.listen(port, () => {
  console.log(`Car doctor server is runnig on port ${port}`);
});
