import crypto from 'crypto';
import { ApiError } from '../utils/ApiError.js';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID?.trim();
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY?.trim();
const CASHFREE_ENV = (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase();
const SANDBOX_SIGNING_SECRET =
  process.env.JWT_SECRET || 'parkgrid_cashfree_sandbox_hmac_key';

const CASHFREE_BASE_URL =
  CASHFREE_ENV === 'PRODUCTION'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

// Server-side registry of sandbox orders so verification NEVER trusts client state
const sandboxOrders = new Map();

export function isLiveCashfreeConfigured() {
  return Boolean(CASHFREE_APP_ID && CASHFREE_SECRET_KEY);
}

function signSandboxPayload(orderId, amount) {
  return crypto
    .createHmac('sha256', SANDBOX_SIGNING_SECRET)
    .update(`${orderId}:${amount}`)
    .digest('hex');
}

export async function createCashfreeOrder({
  orderId,
  amount,
  currency = 'INR',
  customer,
  returnUrl,
}) {
  const normalizedAmount = Number(Number(amount).toFixed(2));

  if (isLiveCashfreeConfigured()) {
    const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: normalizedAmount,
        order_currency: currency,
        customer_details: {
          customer_id: customer.id.toString(),
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone || '9999999999',
        },
        order_meta: {
          return_url: returnUrl,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(502, data.message || 'Cashfree order creation failed');
    }

    return {
      gateway: 'CASHFREE',
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      amount: normalizedAmount,
      currency,
      mode: CASHFREE_ENV,
    };
  }

  // Built-in Cashfree Sandbox Simulation (server-authoritative order ledger)
  const paymentSessionId = `session_cf_${crypto.randomBytes(12).toString('hex')}`;
  const signature = signSandboxPayload(orderId, normalizedAmount);

  sandboxOrders.set(orderId, {
    orderId,
    paymentSessionId,
    amount: normalizedAmount,
    currency,
    status: 'ACTIVE',
    signature,
    transactionId: null,
    method: null,
    createdAt: new Date(),
  });

  return {
    gateway: 'CASHFREE_SANDBOX',
    orderId,
    paymentSessionId,
    amount: normalizedAmount,
    currency,
    mode: 'SANDBOX_SIMULATION',
    sandboxSignature: signature,
  };
}

export async function completeSandboxCheckout({
  orderId,
  outcome = 'SUCCESS',
  method = 'UPI',
}) {
  const order = sandboxOrders.get(orderId);
  if (!order) {
    throw new ApiError(404, 'Sandbox payment order not found or expired.');
  }

  if (outcome === 'FAILED') {
    order.status = 'FAILED';
    order.failureReason = 'Bank declined transaction in Cashfree Sandbox';
    order.method = method;
    return { ...order };
  }

  order.status = 'PAID';
  order.method = method;
  order.transactionId = `CF_TXN_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  order.paidAt = new Date();
  return { ...order };
}

export async function verifyCashfreePayment(orderId, expectedAmount) {
  if (isLiveCashfreeConfigured()) {
    const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(502, data.message || 'Unable to verify payment with Cashfree');
    }

    const paid = data.order_status === 'PAID';
    if (paid && Math.abs(Number(data.order_amount) - Number(expectedAmount)) > 0.01) {
      throw new ApiError(400, 'Payment amount mismatch detected during verification.');
    }

    return {
      verified: paid,
      orderStatus: data.order_status,
      transactionId: data.cf_order_id ? `CF_${data.cf_order_id}` : `CF_${orderId}`,
      method: 'CASHFREE_PG',
      failureReason: paid ? null : `Order status is ${data.order_status}`,
    };
  }

  // Verify against server-authoritative sandbox ledger
  const order = sandboxOrders.get(orderId);
  if (!order) {
    throw new ApiError(404, 'Payment order not found on Cashfree gateway.');
  }

  const expectedSig = signSandboxPayload(order.orderId, order.amount);
  if (order.signature !== expectedSig) {
    throw new ApiError(400, 'Payment order integrity check failed.');
  }

  if (Math.abs(Number(order.amount) - Number(expectedAmount)) > 0.01) {
    throw new ApiError(400, 'Payment amount mismatch detected.');
  }

  return {
    verified: order.status === 'PAID',
    orderStatus: order.status,
    transactionId: order.transactionId,
    method: order.method || 'UPI',
    failureReason: order.status === 'PAID' ? null : order.failureReason || 'Payment not completed',
  };
}

export async function processCashfreeRefund({ orderId, refundAmount, reason }) {
  const refundId = `CF_REF_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

  if (isLiveCashfreeConfigured()) {
    const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify({
        refund_amount: Number(Number(refundAmount).toFixed(2)),
        refund_id: refundId,
        refund_note: reason || 'Parking reservation cancelled',
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new ApiError(502, errData.message || 'Cashfree refund request failed');
    }
  }

  const sandboxOrder = sandboxOrders.get(orderId);
  if (sandboxOrder) {
    sandboxOrder.status = 'REFUNDED';
    sandboxOrder.refundId = refundId;
    sandboxOrder.refundAmount = refundAmount;
  }

  return {
    refundId,
    refundAmount: Number(Number(refundAmount).toFixed(2)),
    refundedAt: new Date(),
  };
}
