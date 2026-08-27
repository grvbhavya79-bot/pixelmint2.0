/**
 * Generates the UPI support QR code for Pixelmint.fun.
 * Output: public/images/upi-qr.png (512px, scannable by GPay/PhonePe/Paytm/BHIM)
 */
import QRCode from "qrcode";
import { mkdirSync } from "node:fs";

const UPI_ID = "grvbhavya55@axl";
const PAYEE_NAME = "Pixelmint";
// Standard UPI deep link — any UPI app reads pa (address), pn (name), cu (currency)
const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&cu=INR`;

mkdirSync("public/images", { recursive: true });

await QRCode.toFile("public/images/upi-qr.png", upiLink, {
  width: 512,
  margin: 2,
  errorCorrectionLevel: "M",
  color: { dark: "#0B2B1E", light: "#FFFFFF" },
});

console.log("UPI QR generated → public/images/upi-qr.png");
console.log("Encodes:", upiLink);
