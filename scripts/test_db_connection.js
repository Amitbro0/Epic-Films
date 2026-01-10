import mongoose from 'mongoose';

const uri = "mongodb+srv://Amitbro0:Amitbro07@cluster0.dftfthc.mongodb.net/video-studio?appName=Cluster0";

async function testConnection() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(uri);
        console.log("Connected successfully!");
        console.log("State:", mongoose.connection.readyState);
        await mongoose.disconnect();
    } catch (error) {
        console.error("Connection failed:", error);
    }
}

testConnection();
