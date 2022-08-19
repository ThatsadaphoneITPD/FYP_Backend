const express = require("express");
const Stripe = require("stripe");
const { Order } = require("../models");
const router = express.Router();
const stripe = Stripe(process.env.STRIPE_KEY);

router.post("/create-checkout-session", async (req, res) => {
  //list Items in Cart
  const line_items = req.body.cartItem.map((item) => {
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.image],
          description: item.desc,
          metadata: {
            id: item.id,
          },
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    };
  });
  // Customer's info of cart
  const customerData = req.body.cartItem.map((item) => {
    return {
      id: item.id,
      qty: item.quantity,
      p: item.price,
    };
  });
  const customer = await stripe.customers.create({
    metadata: {
      userId: req.body.userId,
      cart: JSON.stringify(customerData),
    },
  });
  //Shipping info
  const shipping_option = [
    {
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: {
          amount: 0,
          currency: "usd",
        },
        display_name: "Free shipping",
        // # Delivers between 5-7 business days
        delivery_estimate: {
          minimum: {
            unit: "business_day",
            value: 5,
          },
          maximum: {
            unit: "business_day",
            value: 7,
          },
        },
      },
    },
    {
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: {
          amount: 1500,
          currency: "usd",
        },
        display_name: "Next day air",
        // # Delivers in exactly 1 business day
        delivery_estimate: {
          minimum: {
            unit: "business_day",
            value: 1,
          },
          maximum: {
            unit: "business_day",
            value: 1,
          },
        },
      },
    },
  ];

  //Add Phone nunber
  const phone_number = {
    enabled: true,
  };

  //Payment method
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    shipping_address_collection: {
      allowed_countries: ["US", "VN", "LA"],
    },
    shipping_options: shipping_option,
    phone_number_collection: phone_number,
    line_items,
    mode: "payment",
    customer: customer.id,
    success_url: `${process.env.CLIENT_URL}/checkout-success`,
    cancel_url: `${process.env.CLIENT_URL}/checkout`,
  });

  // res.redirect(303, session.url);
  res.send({ url: session.url });
});

// Create order function
const createOrder = async (customer, data) => {
  const Items = JSON.parse(customer.metadata.cart);

  const products = Items.map((item) => {
    return {
      productId: item.id,
      price: item.p * item.qty,
      quantity: item.qty,
    };
  });

  const newOrder = new Order({
    user: customer.metadata.userId,
    customerId: data.customer,
    paymentIntentId: data.payment_intent,
    products,
    subtotal: data.amount_subtotal,
    total: data.amount_total,
    shipping: data.customer_details,
    payment_status: data.payment_status,
  });

  try {
    const savedOrder = await newOrder.save();
    console.log("Processed Order:", savedOrder);
  } catch (err) {
    console.log(err);
  }
};

// Stripe webhoook
// This is your Stripe CLI webhook secret for testing your endpoint locally.

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    let data;
    let eventType;
    let endpointSecret = process.env.STRIPE_WEB_HOOK;

    if (endpointSecret) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      const sig = req.headers["stripe-signature"];
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.log(
          `⚠️  Webhook signature verification failed:  ${err.message}`
        );
        res.sendStatus(400).send(`⚠️ Err failed:  ${err.message}`);
        return;
      }
      data = req.body.data.object;
      eventType = req.body.type;
    } else {
      data = req.body.data.object;
      eventType = req.body.type;
    }

    // Handle the event
    if (eventType === "checkout.session.completed") {
      stripe.customers
        .retrieve(data.customer)
        .then(async (customer) => {
          // console.log("customer", customer);
          // console.log("data:", data);
          try {
            // CREATE ORDER
            createOrder(customer, data);
          } catch (err) {
            res.sendStatus(500).send(`⚠️Create Oeder fail:  ${err.message}`);
            console.log(typeof createOrder);
            console.log(err);
          }
        })
        .catch((err) => {
          res
            .sendStatus(500)
            .send(`⚠️ Pay Checkout Strip Fail:  ${err.message}`);
          console.log(err.message);
        });
    }

    // Return a 200 res to acknowledge receipt of the event
    res.status(200).send("Payment Completed").end();
  }
);

module.exports = router;
