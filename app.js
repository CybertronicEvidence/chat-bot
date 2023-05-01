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
        const { paymentId } = req.body.custom_fields;
        const subscriptionId = req.body.data.subscription.id;

        // Query user model for user with given phone number
        const user = await User.findOne({ where: { paymentId } });
        if (!user) {
            return res.status(400).send('User not found');
        }
        const Subscription = await user.getSubscription();

        // Update subscription model for user
        const subscriptions = await WooCommerce.get(`subscriptions?paymentId=${paymentId}`);

        const subscription = subscriptions.find(subscription => subscription.id === subscriptionId);

        const { status, date_expiry_gmt } = subscription;
        await Subscription.update({
            expiryDate: new Date(date_expiry_gmt),
        }, { where: { userId: user.id } });

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