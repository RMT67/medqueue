// import { MongoClient, ServerApiVersion } from "mongodb";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";

const client = new MongoClient(uri);

export const db = client.db("medqueue-test");

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// async function db() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("medqueue-test").command({ ping: 1 });
//     console.log(
//       "Pinged your deployment. You successfully connected to MongoDB!"
//     );
//     return client.db("medqueue-test");
//   } catch (e) {
//     console.log(e);
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }

// export default db;
