import { Injectable } from "@nestjs/common";
import {
  CreateOrderStripe,
  CreateOrderTransfer,
} from "./dto/create-payment.dto";
import { AcceptOrderStripe } from "./dto/accept-payment.dto";
import { InjectModel } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Payment } from "./schemas/payment.entity";
import { Client } from "src/auth/schemas/client.schema";
import { InvoiceDetails } from "src/invoice/schemas/invoice-details.schema";
import sendMail from "src/utils/sendMail";
import { log } from "console";
const gocardless = require("gocardless-nodejs");
const constants = require("gocardless-nodejs/constants");

const fs = require("fs");
const PDFDocument = require("pdfkit");

const square = require('square');

function generateId() {
  const length = 10;
  const digits = "0123456789";
  let id = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    id += digits.charAt(randomIndex);
  }

  return String(id);
}

@Injectable()
export class PaymentService {
  private client;
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: mongoose.Model<Payment>,
    @InjectModel(InvoiceDetails.name)
    private invoiceDetail: mongoose.Model<InvoiceDetails>,
    @InjectModel(Client.name)
    private clientModel: mongoose.Model<Client>
  ) {
    this.client = gocardless(
      process.env.GOCARDLESS_ACCESS_TOKEN,
      constants.Environments.Sandbox,
    );
  }

  async createPDF(result: any, data: Object) {
    function getFormattedDate() {
      const date = new Date();
      const day = date.getDate();
      const month = date.getMonth() + 1; // Months are zero-indexed
      const year = date.getFullYear();

      return `${month}/${day}/${year}`;
    }

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream("invoice.pdf");
    doc.pipe(writeStream);

    // Header
    doc.fontSize(20).text("INVOICE", 50, 50);

    // Sender's details
    if (result.countryPay === "international") {
      doc.fontSize(10).text("TECHNO TV LTD", 50, 100);
      doc.text("124 City Road", 50, 115);
      doc.text("EC1V 2NX – London – England - UK", 50, 130);
      doc.text("IBAN: GB47REVO00996994280983", 50, 145);
      doc.text("BIC: REVOGB21", 50, 160);
      doc.text("Intermediary BIC: CHASDEFX", 50, 175);
      doc.text("Bank/Payment institution: Revolut Ltd", 50, 190);
      doc.text(
        "Bank/Payment institution address: 7 Westferry Circus, E14 4HD, London, United Kingdom",
        50,
        205
      );
    } else if (result.countryPay === "eu") {
      doc.fontSize(10).text("TECHNO TV LTD", 50, 100);
      doc.text("124 City Road", 50, 115);
      doc.text("EC1V 2NX – London – England - UK", 50, 130);
      doc.text("IBAN: GB91REVO00997094280983", 50, 145);
      doc.text("BIC: REVOGB21", 50, 160);
      doc.text("Bank/Payment institution: Revolut Ltd", 50, 175);
      doc.text(
        "Bank/Payment institution address: 7 Westferry Circus, E14 4HD, London, United Kingdom",
        50,
        190
      );
    } else if (result.countryPay === "uk") {
      doc.fontSize(10).text("TECHNO TV LTD", 50, 100);
      doc.text("124 City Road", 50, 115);
      doc.text("EC1V 2NX – London – England - UK", 50, 130);
      doc.text("Account number: 17299128", 50, 145);
      doc.text("Sort code: 04-00-75", 50, 160);
      doc.text("Bank/Payment institution: Revolut Ltd", 50, 175);
      doc.text(
        "Bank/Payment institution address: 7 Westferry Circus, E14 4HD, London, United Kingdom",
        50,
        190
      );
    } else {
      doc.fontSize(10).text("TECHNO TV LTD", 50, 100);
      doc.text("124 City Road", 50, 115);
      doc.text("EC1V 2NX – London – England - UK", 50, 130);
    }

    // Date and Invoice Number
    doc.text(`DATE: ${getFormattedDate()}`, 400, 100);
    doc.text(`INVOICE NO. ${result?._id}`, 400, 115);

    // Bill To
    doc.text("BILL TO", 50, 240);
    doc.text(result.beneficiary, 50, 255);
    doc.text(result.street + " " + result.country, 50, 270);
    if (result.company) {
      doc.text("Company: " + result.company, 50, 285);
    }
    if (result.vatNumber) {
      doc.text("VAT: " + result.vatNumber, 250, 285);
    }

    // Table headers
    doc.text("DESCRIPTION", 50, 350);
    // doc.text('QTY', 200, 300);
    doc.text("TOTAL", 250, 350);

    // Table content
    doc.text("Instagram Promotion", 50, 365);
    // doc.text('1', 200, 315);
    doc.text(result.amount + "€", 250, 365);

    // Payment details
    doc.text("SUBTOTAL:", 50, 400);
    doc.text(result.amount + "€", 250, 400);
    doc.text("BALANCE DUE:", 50, 415);
    doc.text(result.amount + "€", 250, 415);

    // Payment method and terms
    doc.text("Payment Terms: Within 7 business days", 50, 465);

    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => resolve("invoice.pdf"));
      writeStream.on("error", reject);
    });
  }

  async createOrderStripe(data: CreateOrderStripe) { // Updated input type
    if (
      !data.amount ||
      typeof data.amount !== `number` ||
      !data.nameProduct ||
      !data.userId
    ) {
      return {
        code: 400,
        message: "Not enough arguments",
      };
    }
  
    const createId = generateId(); // Assuming you have this function
  
    try {
      // 1. Create Square Order
      const squareClient = new square.Client({ // Initialize Square Client
        accessToken: process.env.SQUARE_ACCESS_TOKEN,
        environment: 'sandbox' // Or 'sandbox' for testing
      });
  
      const orderResult = await squareClient.ordersApi.createOrder({
        idempotencyKey: createId, 
        order: {
          locationId: process.env.SQUARE_LOCATION_ID, // Your Square location ID
          lineItems: [
            {
              name: data.nameProduct,
              quantity: "1",
              basePriceMoney: {
                amount: data.amount * 100, // Convert to cents
                currency: "EUR"
              }
            }
          ],
          // You can add taxes, discounts, etc. if needed
        }
      });
  
      // 2. Store Order
      await this.paymentModel.create({
        orderId: orderResult.result.order.id, // Store Square Order ID
        userId: data.userId,
        amount: String(data.amount),
        status: "pending_authorization", 
      });
  
      // 3. Create and Return Payment Link
      const paymentResponse = await squareClient.checkoutApi.createPaymentLink({
        order_id: orderResult.result.order.id,
        idempotency_key: createId, // Reuse same idempotency key
        ask_for_shipping_address: false, // Adjust if needed
        // Add other checkout options
      });
  
      return {
        code: 201,
        paymentUrl: paymentResponse.result.payment_link.url
      };
    } catch (err) {
      console.log(err);
      return {
        code: 500,
        message: "An error occurred while processing the order." // Generic for now
      };
    }
  }
  

  async createOrderTransfer(data: CreateOrderTransfer) {
    if (
      !data.amount ||
      typeof data.amount !== `number` ||
      !data.nameProduct ||
      !data.userId
    ) {
      return {
        code: 400,
        message: "Not enough arguments",
      };
    }
    const createId = generateId();

    try {
      await this.paymentModel.create({
        orderId: createId,
        userId: data.userId,
        amount: String(data.amount),
        statusOrder: "accept",
        paymentType: "transfer",
      });

      const invoiceDetail = await this.invoiceDetail.find({ id: data.userId });
      const clientDetail = await this.clientModel.findById(data.userId);

      const result = {
        _id: createId,
        beneficiary:
          invoiceDetail[0]?.firstName + " " + invoiceDetail[0]?.lastName ||
          clientDetail.firstName,
        street: invoiceDetail[0]?.address || "",
        country: invoiceDetail[0]?.country || "",
        company: invoiceDetail[0]?.company || "",
        vatNumber: invoiceDetail[0]?.vatNumber || "",
        countryPay: data.country || "",
        amount: data.amount,
      };

      await this.createPDF(result, data)
        .then(async (pdfPath) => {
          await sendMail(
            clientDetail.email,
            "Invoice",
            `<p>Hello,</p>
            <p>Please find attached the invoice for your SoundInfluencers campaign.</p><br/>
            <p> To monitor the progress of your campaign, please visit the <a href="https://go.soundinfluencers.com/account/client/ongoing-promos">"Ongoing Promo"</a>  section in the homepage in <a href="https://go.soundinfluencers.com">go.soundinfluencers.com</a></p><br/>
            <p>Best regards,
            SoundInfluencers Team</p>`,
            "pdf",
            pdfPath as string
          );
        })
        .catch((error) => {
          console.error("Error creating PDF:", error);
        });

      return {
        code: 201,
        message: "ok",
      };
    } catch (err) {
      console.log(err);

      return {
        code: 500,
        message: err,
      };
    }
  }

  async createOneOffPayment(orderId: string, flowId: string, amount: string) {
    try {
      let redirectFlowResponse = await this.client.redirectFlows.find(flowId);

      if (!redirectFlowResponse?.links?.mandate) {
        redirectFlowResponse = await this.client.redirectFlows.complete(
          flowId,
          {
            session_token: orderId,
          }
        );
      }
      
      const payment = await this.client.payments.create(
        {
          amount: `${amount}00`,
          currency: "EUR", // Adapt currency as needed
          links: { mandate: redirectFlowResponse.links.mandate },
          metadata: { orderId }, // Optional, useful for webhook handling
        },
        { idempotencyKey: orderId }
      );

      return {
        paymentId: payment.id,
        paymentStatus: payment.status, // Maybe helpful for updates if needed
      };
    } catch (error) {
      throw error; // Or handle as appropriate for your application
    }
  }

  async acceptOrderStripe(orderId: string, flowId: string, res: any) {
    if (!orderId) {
      return {
        code: 400,
        message: "Not enough arguments",
      };
    }

    try {
      const checkOrder = await this.paymentModel.findOne({ orderId });

      if (!checkOrder) {
        return {
          code: 404,
          message: "not found order",
        };
      }

      const paymentStatus = await this.createOneOffPayment(
        orderId,
        flowId,
        checkOrder.amount
      );


      await this.paymentModel.findOneAndUpdate(
        { _id: checkOrder._id },
        { statusOrder: "accept" }
      );

      const invoiceDetail = await this.invoiceDetail.find({
        id: checkOrder.userId,
      });
      const clientDetail = await this.clientModel.findById(checkOrder.userId);

      const result = {
        _id: checkOrder._id,
        beneficiary:
          invoiceDetail[0]?.firstName + invoiceDetail[0]?.lastName ||
          clientDetail.firstName,
        street: invoiceDetail[0]?.address || "",
        country: invoiceDetail[0]?.country || "",
        amount: checkOrder.amount,
        company: invoiceDetail[0]?.company || "",
        vatNumber: invoiceDetail[0]?.vatNumber || "",
      };

      await this.createPDF(result, res)
        .then(async (pdfPath) => {
          await sendMail(
            clientDetail.email,
            "Invoice",
            `<p>Hello,</p>
            <p>Please find attached the invoice for your SoundInfluencers campaign.</p><br/>
            <p> To monitor the progress of your campaign, please visit the <a href="https://go.soundinfluencers.com/account/client/ongoing-promos">"Ongoing Promo"</a>  section in the homepage in <a href="https://go.soundinfluencers.com">go.soundinfluencers.com</a></p><br/>
            <p>Best regards,
            SoundInfluencers Team</p>`,
            "pdf",
            pdfPath as string
          );
        })
        .catch((error) => {
          console.error("Error creating PDF:", error);
        });

      res.redirect(`${process.env.SERVER_CLIENT}/account/client`);

      return {
        code: 200,
        message: "ok",
      };
    } catch (err) {
      console.log(err);
      return {
        code: 500,
        message: err,
      };
    }
  }

  async cancelOrderStripe(orderId: string, res: any) {
    if (!orderId) {
      return {
        code: 400,
        message: "Not enough arguments",
      };
    }

    try {
      const checkOrder = await this.paymentModel.findOne({ orderId: orderId });

      if (!checkOrder) {
        return {
          code: 404,
          message: "not found order",
        };
      }

      await this.paymentModel.findOneAndUpdate(
        { _id: checkOrder._id },
        { statusOrder: "cancel" }
      );

      res.redirect(`${process.env.SERVER_CLIENT}/account/client`);

      return {
        code: 200,
        message: "ok",
      };
    } catch (err) {
      console.log(err);
      return {
        code: 500,
        message: err,
      };
    }
  }
}
