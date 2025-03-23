import clientPromise from "@/lib/mongodb";
import Cors from 'cors';

// Initializing the cors middleware
const cors = Cors({
  methods: ['GET', 'HEAD'],
});

function initMiddleware(middleware) {
  return (req, res) =>
    new Promise((resolve, reject) => {
      middleware(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
}

const corsMiddleware = initMiddleware(cors);

export default async function handler(req, res) {
  await corsMiddleware(req, res); // Run the cors middleware

  const { method, query } = req;
  const client = await clientPromise;
  const db = client.db();

  try {
    if (method === "GET") {
      const { email } = query;

      if (!email) {
        res.status(400).json({ message: "Email parameter is required" });
        return;
      }

      const users = await db.collection("users").find({}).toArray();
      
      if (users.length !== 2) {
        res.status(500).json({ message: "Expected exactly 2 users in the database" });
        return;
      }

      const otherUser = users.find(user => user.email !== email);
      
      if (otherUser) {
        res.status(200).json(otherUser);
      } else {
        res.status(404).json({ message: "Other user not found" });
      }
    } else {
      res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
