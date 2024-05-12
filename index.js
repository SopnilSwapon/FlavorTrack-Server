require('dotenv').config()
const express = require('express');
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000


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
   const PurchaseFoodsCollection = client.db('deliciousFoods').collection('purchaseFoods');

    

//________________get all foods _______________//
   app.get('/foods', async(req, res) => {
    const result = await foodsCollection.find().toArray();
    res.send(result)
   });
   app.get('/foods/six', async(req, res) =>{
    const size = parseInt(req.query.size);
        const sorted = parseInt(req.query.sort);
        // const result = await foodsCollection.find().sort({ purchase: sorted }).limit(size).toArray();
        const result = await foodsCollection.find().sort({purchase: sorted}).limit(size).toArray();
        res.send(result)
   })
  //  ___________get a specific food_____________//
  app.get('/foods/:id', async (req, res) =>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await foodsCollection.findOne(query);
    res.send(result)
  })
  //_____________get some food which are added current user___________//
  app.get('/foods/currentuser/:email', async (req, res) =>{
    const email = req.params.email
    console.log("current usersssss", email);
    const query = {email: email};
    const result = await foodsCollection.find(query).toArray();
    res.send(result)
  })
//    _______________post food_________________//
app.post('/food', async(req, res) =>{
    const food = req.body;
    const result = await foodsCollection.insertOne(food);
    res.send(result)
});
// _____________update a food____________//
app.put('/foods/:id', async(req, res) =>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)}
   const food = req.body;
   const options = { upsert: true };
   const updateFood = {
    $set:{
      ...food
    }
   };
   const result = await foodsCollection.updateOne(filter, updateFood, options)
   res.send(result)
});
// _____________post purchase food in new collection______________//
 app.post('/purchase', async(req, res) =>{
  const purchaseFood = req.body;
  const result = await PurchaseFoodsCollection.insertOne(purchaseFood);
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
