const express = require("express");
const app = express();
const { connectDB } = require("./config/database.config")
const User = require("./models/user.model");
const WooCommerceAPI = require('woocommerce-api');
require("dotenv").config()

const port = process.env.PORT || 5050;

// Set up WooCommerce API connection
const WooCommerce = new WooCommerceAPI({
    url: 'https://yourstore.com',
    consumerKey: 'your_consumer_key',
    consumerSecret: 'your_consumer_secret',
    wpAPI: true,
    version: 'wc/v3',
});

// Define webhook endpoint to receive subscription updates
app.post('/subscriptions', async (req, res) => {
    try {
        const { phone, subscriptionId } = req.body;

        // Query user model for user with given phone number
        const user = await User.findOne({ where: { phone } });
        if (!user) {
            return res.status(400).send('User not found');
        }
        const Subscription = await user.getSubscription();

        // Update subscription model for user
        const subscription = await WooCommerce.get(`subscriptions/${subscriptionId}`);
        await Subscription.update({ status: subscription.status }, { where: { userId: user.id } });

        return res.status(200).send('Subscription updated');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }
});

(async () => {
    try {
        await connectDB();
    } catch (err) {
        console.log(err)
    }
    console.log("Successfully connected to database...");
    app.listen(port, () => console.log(`Listening for requests on port ${port}`));
})();