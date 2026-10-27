// Built-in Node.js tool for secure random numbers
import crypto from "crypto";

// Creates the 6-digit email verification code.
// crypto.randomInt is secure. Math.random() can be predicted.
export const GenerateVerificationCode = () =>{
    // Gives a number from 100000 up to 999999
    return crypto.randomInt(100000, 1000000).toString();
}
