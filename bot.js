const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const openai = require("./config/openai.config")
const fs = require("fs");
const { connectDB } = require("./config/database.config")
const User = require("./models/user.model");
const Subscription = require("./models/subscription.model")

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth()
});

// Start client
client.on('qr', (qr) => {
    // Generate QR code for user to scan
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    try {
        await connectDB()
            .then(() => console.log('Database Connected!'))
    } catch (err) {
        console.log(err)
    }
    console.log('Client is ready!');
});

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    chat.sendStateTyping();

    // check for audio file

    // Check if user is registered
    const user = await checkUserRegistration(msg.from);
    if (!user) {
        await registerUser(msg.from);
        await chat.sendMessage('Welcome to my bot! You have a free 2-minute trial period. Ask me anything!');
        // Set timer for 10 minutes
        setTimeout(async () => {
            await chat.sendMessage('Your free trial period has expired. Please register a subscription to continue using the bot!!.');
        }, 120000); // 10 minutes
    } else {
        // Check if user's subscription has expired
        const subscription = await user.getSubscription();
        if (subscription && subscription.expirationDate < new Date()) {
            chat.sendMessage('Your subscription has expired. Please renew it to continue using the bot.');
            return;
        }

        if (msg.hasMedia) {
            console.log(msg);

            console.log("Media");
            // download media into /voice folder
            const media = await msg.downloadMedia();
            console.log(media);

            const filePath = `./voice/voice${randomInt()}.ogg`;
            const buffer = Buffer.from(media.data, 'base64');

            fs.writeFileSync(filePath, buffer)
            console.log(`wrote ${buffer.byteLength.toLocaleString()} bytes to file.`)

            // convert to mp3
            await ffmpeg(filePath)
                .audioCodec('libmp3lame')
                .audioBitrate('128k')
                .on('error', err => console.error('Error: ', err))
                .on('end', async () => {

                    console.log('Conversion to mp3 completed')
                    // transcribe voice to text
                    let resp = {}
                    try {
                        resp = await openai.createTranscription(
                            fs.createReadStream(filePath.replace('.ogg', '.mp3')),
                            "whisper-1",
                            "en-US"
                        );

                        // transcribed text
                        const messages = await resp.data.text;

                        // generate response for transcribed text
                        const message = await generateResponse(messages);

                        // send message to user
                        await chat.sendMessage(message);
                        console.log('Transcription: ' + msg_to_process);
                    } catch (e) {
                        console.log(e);
                    }

                    try {
                        // Delete voice file
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                console.log('Error deleting ' + filePath);
                                return
                            }
                            console.log(`${filePath} was deleted`)
                        })

                        fs.unlink(filePath.replace('.ogg', '.mp3'), (err) => {
                            if (err) {
                                console.log('Error deleting ' + filePath.replace('.ogg', '.mp3'));
                                return
                            }
                            console.log(`${filePath.replace('.ogg', '.mp3')} was deleted`)
                        })

                    } catch (error) {
                        console.log(error)
                    }
                })
                .save(filePath.replace('.ogg', '.mp3'));
        }
        // Generate response using OpenAI
        const response = await generateResponse(msg.body);

        // Send response to user
        await chat.sendMessage(response);
    }
});

// Check if user is registered
async function checkUserRegistration(phoneNumber) {
    try {
        const user = await User.findOne({
            where: { phoneNumber },
            include: Subscription,
        });
        return user;
    } catch (error) {
        console.error('Error checking user registration', error);
    }
}

// Register user
async function registerUser(phoneNumber) {
    try {
        const user = await User.create({
            phoneNumber,
        });
        return user;
    } catch (error) {
        console.error('Error registering user', error);
    }
}

// Generate response using OpenAI
async function generateResponse(input) {
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: `${input}` }],
    });

    return completion.data.choices[0].message.content;
}

async function getError(input) {
    return 'Your free trial period has expired. Please register a subscription to continue using the bot.'
}

// Start client
client.initialize();
