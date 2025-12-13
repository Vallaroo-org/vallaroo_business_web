import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID || "NO_KEY";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "NO_SECRET";

if (!process.env.RAZORPAY_KEY_ID) {
    console.warn('RAZORPAY_KEY_ID is not defined - Payment features will not work');
}

export const razorpay = new Razorpay({
    key_id,
    key_secret,
});
