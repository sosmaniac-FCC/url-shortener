const express = require('express');
const mongodb = require('mongodb');
const app = express();

app.use(express.static('public'));

const proj = 'https://url-microservice-3.glitch.me';
const uri = "mongodb://" 
+ process.env.USER + ":" 
+ process.env.PASS + "@" 
+ process.env.HOST + ":" 
+ process.env.DBPORT + "/" 
+ process.env.DB;

app.get("/", (req, res) => {
  console.log("Default");
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/new/*", (req, res) => {
  console.log("PATH accessible");
  const value = req.path.toString().substring(5, req.path.toString().length);  
  
  if (value.split('').indexOf('.') > -1 && 
    (value.substring(0, 7) == 'http://' || 
    value.substring(0, 8) == 'https://')) {
    console.log("Valid url");
    
    mongodb.MongoClient.connect(uri, (err, db) => {
      if (err) throw err;
      console.log("DB accessible");
      
      const links = db.db("exampleurl").collection('links');
      links.count({}, (err, count) => {
        console.log("Count successful");
        
        const newUrl = proj + '/short/' + count;
        links.insert({"original_url": value, "shortened_url": newUrl},
                    (err, result) => {
          if (err) throw err;
          console.log("IS successful");

          res.send({"original_url": value, "shortened_url": newUrl});
          db.close();
        });
      });
    });
  }
  else {
    console.log("Invalid url");
    
    res.send({"error": true});
  }
});

app.get("/short/*", (req, res) => {
  console.log("Short");
  
  mongodb.MongoClient.connect(uri, (err, db) => {
    if (err) throw err;
    console.log("DB accessible");
    
    const links = db.db("exampleurl").collection('links');
    const value = proj + req.url;  
    console.log(value);
    links.findOne({ $or: [
      {"original_url": value}, 
      {"shortened_url": value}
    ]}, (err, url) => {
      if (err) throw err;
      console.log("File found");
      
      res.redirect(url.original_url);
      db.close();
    });
  });
});

const listener = app.listen(process.env.PORT, () => {
  console.log(listener.address().port);
});
