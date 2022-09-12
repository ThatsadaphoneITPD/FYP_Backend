const express = require("express");
const Stripe = require("stripe");
const { Order, Store } = require("../models");
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
      s: item.shop,
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
  //1. create item Order
  const products = Items.map((item) => {
    return {
      productId: item.id,
      price: item.p * item.qty,
      shop: item.s,
      quantity: item.qty,
      shipping: data.customer_details,
    };
  });
  //2.Puch item in Store.orders array
  async function SaveOrderToStore(item, sh) {
    //find store base on item.shop id
    const store = await Store.findById(sh);
    //if Found same store
    if (store) {
      // store will push or add in array;
      //update new Product in Store;
      await store.update({
        $push: {
          orders: { productId: item.productId },
        },
      });
      console.log(`${item.productId}'s Save Order in Store`);
    } else {
      console.log("can't save Order in Store");
    }
  }
  //save Each product order from different Store
  if (products) {
    products.map((i) => {
      return SaveOrderToStore(i, i.shop);
    });
  }
  //3. save all items in Order
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
  express.json({ type: "application/json" }),
  async (req, res) => {
    let data;
    let eventType;

    // Check if webhook signing is configured.
    let webhookSecret;
    //webhookSecret = process.env.STRIPE_WEB_HOOK;

    if (webhookSecret) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      let signature = req.headers["stripe-signature"];

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed:  ${err}`);
        return res.sendStatus(400);
      }
      // Extract the object from the event.
      data = event.data.object;
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = req.body.data.object;
      eventType = req.body.type;
    }

    // Handle the checkout.session.completed event
    if (eventType === "checkout.session.completed") {
      stripe.customers
        .retrieve(data.customer)
        .then(async (customer) => {
          try {
            // CREATE ORDER
            createOrder(customer, data);
          } catch (err) {
            console.log(typeof createOrder);
            console.log(err);
          }
        })
        .catch((err) => console.log(err.message));
    }

    res.status(200).end();
  }
);

module.exports = router;
