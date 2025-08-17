import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";
import cors from "cors";

const app = express();
app.use(bodyParser.json());
app.use(cors());

const accountSid = "YOUR_TWILIO_SID";
const authToken = "YOUR_TWILIO_AUTH";
const verifySid = "YOUR_TWILIO_VERIFY_SID";
const companyNumber = "COMPANY_PHONE_NUMBER"; 
const twilioNumber = "YOUR_TWILIO_NUMBER";

const client = twilio(accountSid, authToken);

app.post("/send-otp", async (req,res)=>{
  const {phone}=req.body;
  try{
    await client.verify.v2.services(verifySid).verifications.create({to:phone,channel:"sms"});
    res.json({message:`📩 OTP sent to ${phone}`});
  }catch(e){res.status(500).json({message:"❌ Failed to send OTP"});}
});

app.post("/verify-otp", async (req,res)=>{
  const {phone,otp}=req.body;
  try{
    const check = await client.verify.v2.services(verifySid).verificationChecks.create({to:phone,code:otp});
    if(check.status==="approved") res.json({success:true,message:"✅ OTP Verified"});
    else res.json({success:false,message:"❌ Invalid OTP"});
  }catch(e){res.status(500).json({success:false,message:"❌ OTP verification error"});}
});

app.post("/submit-order", async (req,res)=>{
  const {name,phone,flat,addr,cart}=req.body;
  if(!cart||!cart.length) return res.status(400).json({success:false,message:"❌ Empty cart"});
  let summary = cart.map(i=>`${i.qty}×${i.name}`).join(", ");
  try{
    await client.messages.create({
      body:`New order from ${name}, Phone: ${phone}, ${flat}, ${addr}. Items: ${summary}`,
      from:twilioNumber,
      to:companyNumber
    });
    res.json({success:true,message:"✅ Order submitted successfully"});
  }catch(e){res.status(500).json({success:false,message:"❌ Failed to send order to company"});}
});

app.listen(3000,()=>console.log("Server running on port 3000"));
