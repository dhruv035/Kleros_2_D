import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Add Mongo URI to .env.local");
}
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const clientPromise = client.connect();

export default clientPromise;
