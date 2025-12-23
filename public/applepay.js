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
