require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000


// ____middleware_____//
app.use(cors({
  origin: ["http://localhost:5173", 'http://localhost:5174', 'https://flavortrack-a59b2.web.app', 'https://flavortrack-a59b2.firebaseapp.com'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser())

// ____middlewares_________//
const logger = (req, res, next) => {
  console.log("log info", req.method, req.url);
  next();
}
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send('unauthorized access')
  }
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send('unauthorized access')
    }
    req.user = decoded;
    next()
  })
}

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

    // __________auth related api______________//
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '1s' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      res.send({ success: true })
    })
    app.post('/logOut', async (req, res) => {
      const user = req.body;
      res.clearCookie('token', { maxAge: 0,secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', }).send({ success: true })

    })

    // _____________foods related api__________________//

    const foodsCollection = client.db('deliciousFoods').collection('food');
    const PurchaseFoodsCollection = client.db('deliciousFoods').collection('purchaseFoods');
    const usersCollection = client.db('deliciousFoods').collection('users');
    const galleryCollection = client.db('deliciousFoods').collection("galleryFood");
    //________________get all foods _______________//
    app.get('/foods', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      console.log('pagination query', page, size);
      const result = await foodsCollection.find().skip(page * size).limit(size).toArray();
      res.send(result)
    });
    //_______________foods count___________________//
    app.get('/foodsCount', async (req, res) =>{
      const count = await foodsCollection.estimatedDocumentCount();
      res.send({count})
    }) 
    //  ___________get foods according to name by search__________//
    app.get('/foods/search/:name', async (req, res) => {
      const food = req.params.name;
      const query = { foodName: food };
      const result = await foodsCollection.find(query).toArray();
      res.send(result)
    })
    // ___________get six foods which are most sold______________//
    app.get('/foods/six', async (req, res) => {
      const size = parseInt(req.query.size);
      const sorted = parseInt(req.query.sort);
      const result = await foodsCollection.find().sort({ purchase: sorted }).limit(size).toArray();
      res.send(result)
    })
    //  ___________get a specific food_____________//
    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await foodsCollection.findOne(query);
      res.send(result)
    })
    //_____________get some food which are added current user___________//
    app.get('/foods/currentuser/:email',async (req, res) => {
      const email = req.params.email;
      // if (req.user.email !== req.params?.email) {
      //   return res.status(403).send('forbidden access')
      // }
      const filter = { email: email };
      const result = await foodsCollection.find(filter).toArray();
      res.send(result)
    })

    //    _______________post a food_________________//
    app.post('/food', async (req, res) => {
      const food = req.body;
      const result = await foodsCollection.insertOne(food);
      // if (req.user.email !== req.query.email) {
      //   return res.status(403).send('forbidden access')
      // }
      res.send(result)
    });
    // _____________update a food____________//
    app.put('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const food = req.body;
      const options = { upsert: true };
      const updateFood = {
        $set: {
          ...food
        }
      };
      const result = await foodsCollection.updateOne(filter, updateFood, options)
      res.send(result)
    });
    // _____________post purchase food in new collection______________//
    app.post('/purchase', async (req, res) => {
      const purchaseFood = req.body;
      // if (req.user.email !== req.query.email) {
      //   return res.status(403).send('forbidden access')
      // }
      const result = await PurchaseFoodsCollection.insertOne(purchaseFood);
      res.send(result)
    })
    // ___________get purchases foods of current logged user___________//
    app.get('/purchase/:email', async (req, res) => {
      const email = req.params.email;
      // if (req.user.email !== email) {
      //   return res.status(403).send('forbidden access')
      // }
      const filter = { buyer_email: email }
      const result = await PurchaseFoodsCollection.find(filter).toArray();
      res.send(result);
    });
    app.delete('/purchase/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await PurchaseFoodsCollection.deleteOne(query);
      res.send(result)
    })
    // _______gallery good get____________//
    app.get('/gallery', async (req, res) => {
      const result = await galleryCollection.find().toArray();
      res.send(result)
    });
    // _________Post a food in Gallery Collection___________//
    app.post('/galleryfood', async (req, res) => {
      const food = req.body;
      const result = await galleryCollection.insertOne(food);
      res.send(result)
    })
    // _______post a user in users collections__________//
    app.post('/user', async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.insertOne(user);
      res.send(result)
    })

    // post user in 
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
app.listen(port, () => {
  console.log(`food server is open on the port ${port}`);
})
