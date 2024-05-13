const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const cookieParser= require("cookie-parser")
require("dotenv").config()
const app = express()
const port = process.env.PORT || 5000;

app.use(cors({
  origin:["http://localhost:5173"],
  credentials:true
}))
  app.use(express.json()) 
  app.use(cookieParser())

  const verifyToken = (req,res,next)=>{

    const token = req.cookies.token
    
    if(!token){
      return res.send({message:"unauthorize user"})
    }

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
      if(err){
        return res.send({message:"unauthorize access"})
      }

      req.user = decoded

      next()
    })
  }

  
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.akl91ab.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const bookCollection = client.db("bookDB").collection("allBooks")
    const categoryCollection = client.db("bookDB").collection("bookCategory")


    app.post("/jwt",async(req,res)=>{

      const user = req.body

      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"1h"})

      res.cookie("token",token,{

       httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"

      }).send({success:true})
    })

    app.post("/logout",async(req,res)=>{

      const user = req.body

      res
      .clearCookie("token", { maxAge: 0,sameSite:"none",secure:true })
      .send({ success: true });
    })







    app.post("/book",verifyToken,async(req,res)=>{
      const book = req.body;
      const result = await bookCollection.insertOne(book)
      res.send(result)
    })

    app.get("/entireBook",verifyToken,async(req,res)=>{


      const result = await bookCollection.find().toArray()
      res.send(result)
    })

    app.get("/bookCategory",async(req,res)=>{

      const result = await categoryCollection.find().toArray()
      res.send(result)
    })

    app.get("/details/:id",async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await bookCollection.findOne(query)
      res.send(result)
    })

    app.get("/books/:category",async(req,res)=>{
      const category = req.params.category;
      const result = await bookCollection.find({category:category}).toArray()
      res.send(result)

    })
    app.get("/updatedBooks/:email",verifyToken,async(req,res)=>{
      const email = req.params.email;
      const result = await bookCollection.find({email:email}).toArray()
      res.send(result)

    })

    app.patch("/update/:id",async(req,res)=>{

      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const option = {upsert:true}
      const updatedBook = req.body;
      const book = {
        $set: {
          photo: updatedBook.photo,
          bookName: updatedBook.bookName,
          authorName: updatedBook.authorName,
          category: updatedBook.category,
          rating:updatedBook.rating
        }
      }

      const result = await bookCollection.updateOne(filter,book,option)

      res.send(result)


    })

    app.patch("/borrowUpdate/:id",async(req,res)=>{
      const id = req.params.id
     const borrowDoc=req.body
     const filter = {_id: new ObjectId(id)}
     const option = {upsert:true}

     const borrow = {
      $set:{
        email:borrowDoc.userEmail,
        name:borrowDoc.userName,
        borrowDate:borrowDoc.borrowedDate,
        returnDate:borrowDoc.returnedDate

      },
      $inc:{quantity:-1}
     }

     const result = await bookCollection.updateOne(filter,borrow,option)

     res.send(result)
    })

    app.patch("/returnBook/:id",async(req,res)=>{

      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const option = {upsert:true}
      const bookReturn = {

        $inc:{quantity:1},
        $unset:{email:""}
      }

      const result = await bookCollection.updateOne(filter,bookReturn,option)

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





  app.get("/",(req,res)=>{
    res.send("Bookish-Bliss server is running")
})

app.listen(port,()=>{
    console.log("bookish bliss server running")
})