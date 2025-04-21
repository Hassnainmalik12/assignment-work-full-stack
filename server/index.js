const express = require("express");
const app = express();
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const cors = require('cors');
const { MongoClient, ObjectId } = require("mongodb");

const url = 'mongodb://localhost:27017/';
const client = new MongoClient(url);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// app.get('/uploads/:fileName', (req, res) => {
//     const filePath = path.join(__dirname, 'uploads', req.params.fileName);
//     res.download(filePath, (err) => {
//         if (err) {
//             console.error("Error downloading file", err);
//             res.status(500).send("Error downloading file.");
//         }
//     });
// });

const DATABASE = 'assign';
const COLLECTION = {
    CONTACTUS:"contactus",
    ORDERNOW:"ordernow",
}
// const COLLECTION = 'register_order';


app.use(cors({
    origin: ["http://localhost:3000", "http://192.168.1.135:3000"],

    credentials: true,

    methods: ['GET', 'POST'],
}));
app.use(express.json()); // very important!

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("connected to database");
    } catch (err) {
        console.log(err);
    }
}
connectToDatabase();

// POST route
app.post('/contact-us-register', async (req, res) => {
    try {
        const db = client.db(DATABASE);
        const col = db.collection(COLLECTION.CONTACTUS);

        const formData = req.body;
        const result = await col.insertOne(formData);

        res.status(200).json({ message: "Form data saved successfully", id: result.insertedId });
    } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.post("/register-order", (req, res) => {

    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.log(err);
        }

        // console.log(files)
        // console.log(fields)
        const paperTopic = fields.paperTopic[0];
        const paperType = fields.paperType[0];
        const deadline = fields.deadline[0];
        const subject = fields.subject[0];
        const noOfWords = fields.noOfWords[0];
        const educationLevel = fields.educationLevel[0];
        const reference = fields.reference[0];
        const referenceStyle = fields.referenceStyle[0];
        const name = fields.name[0];
        const email = fields.email[0];
        const country = fields.country[0];
        const contactNumber = fields.contactNumber[0];
        const details = fields.details[0];




        const originalFilename = files.avatar[0].originalFilename;
        const extension = originalFilename.split(".").pop();

        const sourcePath = files.avatar[0].filepath;
        const database = client.db(DATABASE);
        const collection1 = database.collection(COLLECTION.ORDERNOW);
        const result = await collection1.insertOne({
            paperTopic , paperType ,deadline,subject, noOfWords,educationLevel,reference,referenceStyle,
            name,email,country,contactNumber, details , image: originalFilename
        })



        const insertedId = result.insertedId.toString();
        const newFileName = `${insertedId}.${extension}`;
        const uploaddir = path.join(__dirname, "uploads");


        if (!fs.existsSync(uploaddir)) {
            fs.mkdirSync(uploaddir);
        }
        const newFilePath = path.join(uploaddir, newFileName);
        fs.copyFile(sourcePath, newFilePath, (copyErr) => {
            if (copyErr) {
                console.log(copyErr);
            }
        })

        fs.unlink(sourcePath, (unlinkErr) => {
            if (unlinkErr) {
                // console.log(unlinkErr);

            }
            res.status(200).json({ success: true, message: "Order saved" });


        })

    })
});

app.get('/view_messages', async (req, res) => {

    const database = client.db(DATABASE);
    const usersCollection = database.collection(COLLECTION.CONTACTUS);
    const data = await usersCollection.find({}).toArray();
    res.send({ data });

});
app.get('/view_orders', async (req, res) => {

    const database = client.db(DATABASE);
    const usersCollection = database.collection(COLLECTION.ORDERNOW);
    const data = await usersCollection.find({}).toArray();
    res.send({ data });

});


const port = 3001;
app.listen(port, () => {
    console.log(`app is listening on port ${port}`);
});
