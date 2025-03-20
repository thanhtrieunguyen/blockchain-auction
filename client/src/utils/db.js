import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nft-auction';

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('Connected to MongoDB');
        }
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw new Error('Không thể kết nối tới MongoDB');
    }
};

export default connectDB;