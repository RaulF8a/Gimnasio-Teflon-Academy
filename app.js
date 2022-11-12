import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import ejs from 'ejs';

const app = express ();
const __dirname = path.resolve ();

app.use (bodyParser.urlencoded ({extended: true}));
app.use (express.static ("public"));
app.set ("view engine", "ejs");

// 

app.get ("/", (req, res) => {
    res.render ("home")
});

app.listen (process.env.PORT || 3000, () => {
    console.log ("Server running on port 3000");
});
