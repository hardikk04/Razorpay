const mongoose = require("mongoose");

const connectToDB = async () => {
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    console.log("CONNECTED TO DB");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = connectToDB;
