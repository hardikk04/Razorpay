const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const db = require("./config/db");
db();

const Payment = require("./models/payment");

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/create/orderId", async (req, res) => {
  const options = {
    amount: 50000 * 100, // amount in smallest currency unit
    currency: "INR",
  };
  try {
    const order = await razorpay.orders.create(options);
    res.send(order);

    const newPayment = await Payment.create({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: "pending",
    });
  } catch (error) {
    res.status(500).send("Error creating order");
  }
});

app.post("/api/payment/verify", async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  try {
    const {
      validatePaymentVerification,
    } = require("./node_modules/razorpay/dist/utils/razorpay-utils.js");

    const result = validatePaymentVerification(
      { order_id: razorpayOrderId, payment_id: razorpayPaymentId },
      signature,
      secret
    );
    if (result) {
      const payment = await Payment.findOne({ orderId: razorpayOrderId });
      payment.paymentId = razorpayPaymentId;
      payment.signature = signature;
      payment.status = "completed";
      await payment.save();
      res.json({ status: "success" });
    } else {
      res.status(400).send("Invalid signature");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error verifying payment");
  }
});

app.listen(3000, () => {
  console.log("Server is running on 3000");
});
