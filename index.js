require('dotenv').config()
const express = require('express');
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000

//flavorTrackFoods
// qkWRj5llbQALrvDf
// ____middleware_____//
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nshaxle.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();


    // _____________foods related api__________________//
   const foodsCollection = client.db('deliciousFoods').collection('food');
    

//________________get foods _______________//
   app.get('/foods', async(req, res) => {
    const result = await foodsCollection.find().toArray();
    res.send(result)
   });
//    _______________post food_________________//
app.post('/food', async(req, res) =>{
    const food = req.body;
    const result = await foodsCollection.insertOne(food);
    res.send(result)
})
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('my food page server in on')
})
app.listen(port ,()=>{
    console.log(`food server is open on the port ${port}`);
})
