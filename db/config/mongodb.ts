import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "";

if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

const databaseName = "medqueue_test";

// Singleton pattern untuk MongoClient
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// Function untuk mendapatkan db instance setelah koneksi established
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  const db = client.db(databaseName);

  // Debug logging (server-side only)
  console.log(`[MongoDB] Database name: ${db.databaseName}`);
  const count = await db.collection("doctors").countDocuments();
  console.log(`[MongoDB] doctors collection count: ${count}`);

  return db;
}
