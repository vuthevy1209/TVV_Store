const mongoose = require('mongoose');

// Set Mongoose strictQuery option
mongoose.set('strictQuery', true);


const uri = process.env.MONGO_URI;

async function connect() {
    try {
        await mongoose.connect(uri);
        console.log('Connect to mongodb successfully!!!');
    } catch (error) {
        console.error('Connect to mongodb failure!!!', error);
    }
}

module.exports = { connect };