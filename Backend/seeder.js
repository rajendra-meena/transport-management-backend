const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./Models/UserModel');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

const createAdmin = async () => {
    try {
        const adminsData = [
            {
                name: 'Rehan Admin',
                email: 'admin@gmail.com',
                password: '123',
                role: 'admin',
                phone: '1234567890',
                address: 'Main Office, City',
                isVerified: true,
                status: 'active'
            },
            {
                name: 'Admin One',
                email: 'admin1@gmail.com',
                password: '12345',
                role: 'admin',
                phone: '1234567890',
                address: 'Main Office, City',
                isVerified: true,
                status: 'active'
            }
        ];

        // Delete if exists (Old or same email)
        await User.deleteMany({ role: 'admin' });

        await User.create(adminsData);
        console.log('Admin Users Created Successfully!');
        console.log('1. admin@gmail.com / 123');
        console.log('2. admin1@gmail.com / 12345');
        process.exit();
    } catch (err) {
        console.error('Error creating admin:', err.message);
        process.exit(1);
    }
};

createAdmin();
