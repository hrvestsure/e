const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const cors = require("cors");
const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = 3000;

// Twilio credentials
const accountSid = "YOUR_TWILIO_ACCOUNT_SID";
const authToken = "YOUR_TWILIO_AUTH_TOKEN";
const twilioPhone = "+1234567890";      // Your Twilio number
const companyPhone = "+919876543210";   // Company phone
const client = twilio(accountSid, authToken);

// Send OTP
app.post("/send-otp", (req,res)=>{
  const {phone, otp} = req.body;
  client.messages.create({
    body:`Your OTP is ${otp}`,
    from:twilioPhone,
    to:`+91${phone}`
  })
  .then(()=>res.json({success:true,message:"OTP sent"}))
  .catch(err=>res.status(500).json({success:false,message:err.message}));
});

// Submit order
app.post("/submit-order", (req,res)=>{
  const {name,phone,flat,addr,cart} = req.body;
  const orderMsg = `New Order Received:
Name: ${name}
Phone: ${phone}
Address: ${flat}, ${addr}
Items:
${cart.map(i=>`${i.qty} × ${i.name}`).join("\n")}`;
  client.messages.create({
    body: orderMsg,
    from: twilioPhone,
    to: companyPhone
  })
  .then(()=>res.json({success:true,message:"Order submitted and company notified!"}))
  .catch(err=>res.status(500).json({success:false,message:err.message}));
});

app.listen(port,()=>console.log(`Server running on http://localhost:${port}`));
