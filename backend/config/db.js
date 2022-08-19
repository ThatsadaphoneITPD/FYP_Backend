const mongoose = require("mongoose");

function connectDB(callback) {
  // let uri = process.env.MONGOOSE_URI;
  let uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@ecmartfyp.3bgis.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`;

  return mongoose
    .connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((client) => {
      console.log(
        "Connected to MongoDb server",
        client.connection.name,
        client.connection.host
      );
      if (callback instanceof Function) callback(client);
    })
    .catch((err) => {
      console.log("mongo uri", uri);
      console.log("MongoDb cannot connect to server !");
      console.log(err.message);
      process.exit();
    });
}

module.exports = connectDB;
