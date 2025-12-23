# Apple Pay with PayPal - Base App Template

This document contains all the code needed to create a basic Node.js application with Apple Pay integration using PayPal.

## Project Structure

```
basic-app/
├── server.js
├── package.json
├── public/
│   ├── index.html
│   └── applepay.js
└── README.md
```

## File: package.json

```json
{
  "name": "applepay-basic-app",
  "version": "1.0.0",
  "description": "Basic Apple Pay with PayPal integration",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

## File: server.js

```javascript
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

## File: public/index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apple Pay with PayPal</title>
</head>
<body>
  <div id="paypal-button-container"></div>

  <!-- PayPal SDK with Apple Pay enabled -->
  <script
    src="https://www.te-applepayexpresscheckout.qa.paypal.com/sdk/js?client-id=B_AVICKEzgw8JWtGmEGuZQZe22UeGfxHz5WwjuNvHpc5xet0oRkh0SvQJ6M4vXOJn7QPY-a1FnlXFKLf2E&buyer-country=US&currency=USD&components=buttons&enable-funding=applepay"
    data-sdk-integration-source="developer-studio"
    onload="initPayPalButtons()">
  </script>

  <script src="applepay.js"></script>
</body>
</html>
```

## File: public/applepay.js

```javascript
// Orders Controller
const ordersController = {
  async createOrder() {
    const HOST_URL = 'https://msmaster.qa.paypal.com';
    const auth = localStorage.getItem('auth');

    const response = await fetch(`${HOST_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: '100.00'
          }
        }]
      })
    });

    return response.json();
  },

  async captureOrder(orderID) {
    const HOST_URL = 'https://msmaster.qa.paypal.com';
    const auth = localStorage.getItem('auth');

    const response = await fetch(`${HOST_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body: JSON.stringify({})
    });

    return response.json();
  }
};

// Initialize PayPal Buttons - called after SDK loads
function initPayPalButtons() {
  window.paypal.Buttons({
    style: {
      shape: "rect",
      layout: "vertical",
      color: "gold",
      label: "paypal",
    },
    message: {
      amount: 100,
    },

    async createOrder() {
      try {
        const orderData = await ordersController.createOrder();
        console.log('Order created:', orderData);

        if (orderData.id) {
          return orderData.id;
        }

        const errorDetail = orderData?.details?.[0];
        const errorMessage = errorDetail
          ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
          : JSON.stringify(orderData);

        throw new Error(errorMessage);
      } catch (error) {
        console.error(error);
        alert(`Could not initiate PayPal Checkout... ${error}`);
      }
    },

    async onApprove(data, actions) {
      try {
        console.log('Approved:', data);
        const orderData = await ordersController.captureOrder(data.orderID);
        console.log('Captured:', orderData);

        const errorDetail = orderData?.details?.[0];

        if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
          return actions.restart();
        } else if (errorDetail) {
          throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
        } else if (!orderData.purchase_units) {
          throw new Error(JSON.stringify(orderData));
        } else {
          const transaction =
            orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
            orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];

          alert(`Transaction ${transaction.status}: ${transaction.id}`);
          console.log('Transaction complete', orderData);
        }
      } catch (error) {
        console.error(error);
        alert(`Sorry, your transaction could not be processed... ${error}`);
      }
    },

    async onError(data) {
      console.error('Error:', data);
    }
  }).render("#paypal-button-container");
}
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set auth token in browser console (before testing):**
   ```javascript
   localStorage.setItem('auth', 'YOUR_BEARER_TOKEN_HERE')
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open browser:**
   ```
   http://localhost:3000
   ```

## Important Notes

- **HTTPS Required**: Apple Pay requires HTTPS in production. For local development, you may need to set up SSL certificates.
- **QA Environment**: Currently configured for PayPal QA environment (`te-applepayexpresscheckout.qa.paypal.com`)
- **Client ID**: Replace the client-id in `index.html` with your own PayPal client credentials
- **Auth Token**: The app requires a valid Bearer token stored in localStorage
- **Amount**: Currently set to $100.00 USD - modify in `applepay.js` as needed

## Configuration Options

### Change Payment Amount
In `public/applepay.js`, modify the `createOrder` function:
```javascript
amount: {
  currency_code: 'USD',
  value: '100.00'  // Change this value
}
```

### Change Button Style
In `public/applepay.js`, modify the Buttons configuration:
```javascript
style: {
  shape: "rect",      // pill, rect
  layout: "vertical", // horizontal, vertical
  color: "gold",      // gold, blue, silver, white, black
  label: "paypal",    // paypal, checkout, buynow, pay
}
```

### Switch to Production
Replace the SDK URL in `index.html`:
```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&buyer-country=US&currency=USD&components=buttons&enable-funding=applepay"></script>
```

## Troubleshooting

1. **Apple Pay button not showing**: Ensure you're using Safari browser or a compatible device
2. **Authentication errors**: Verify the Bearer token in localStorage is valid
3. **CORS errors**: May need to configure server-side endpoints for production
4. **SSL errors**: For local development, you may need to set up HTTPS with self-signed certificates
