import {UpdateInvoiceDetailsDto} from "./dto/update-invoice-details";
import {InjectModel} from "@nestjs/mongoose";
import {InvoiceDetails} from "./schemas/invoice-details.schema";
import mongoose from "mongoose";
import {Influencer} from "src/auth/schemas/influencer.schema";
import {CreateInvoiceDtoDto} from "./dto/create-invoice.dto";
import {Invoices} from "./schemas/invoices.schema";
import {SaveInvoiceData} from "./schemas/invoice-save.schema";
import sendMail from "src/utils/sendMail";
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
const fs = require("fs");
const PDFDocument = require("pdfkit");
import {Response} from 'express';

@Injectable()
export class InvoiceService {
    constructor(
        @InjectModel(InvoiceDetails.name)
        private invoiceDetailsModel: mongoose.Model<InvoiceDetails>,
        @InjectModel(Influencer.name)
        private influencerModel: mongoose.Model<Influencer>,
        @InjectModel(Invoices.name)
        private invoicesModel: mongoose.Model<Invoices>,
        @InjectModel(SaveInvoiceData.name)
        private saveInvoiceDataModel: mongoose.Model<SaveInvoiceData>
    ) {
    }

    async updateInvoiceDetails(data: UpdateInvoiceDetailsDto) {
        try {
            if (!data) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            const checkUser = await this.invoiceDetailsModel.findOne({id: data.id});

            if (!checkUser) {
                await this.invoiceDetailsModel.create(data);
            } else {
                await this.invoiceDetailsModel.findOneAndUpdate({id: data.id}, data);
            }

            return {
                code: 200,
                message: "invoice details update",
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async createPDF(result: any, data: Object) {
        function getFormattedDate() {
            const date = new Date();
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
        }

        function getPaymentMethod(): string {
            if (result.selectedPaymentMethod === "Paypal") {
                return `Paypal Email: ${result.paypalEmail}`;
            } else if (result.selectedPaymentMethod.toLowerCase() === "uk bank transfer") {
                return `Bank Name: ${result.bankName}\nBeneficiary: ${result.beneficiary}\nBeneficiary Address: ${result.beneficiaryAddress}\nSort Code: ${result.sortCode}\nAccount Number: ${result.accountNumber}`;
            } else if (result.selectedPaymentMethod.toLowerCase() === "international bank transfer") {
                return `Bank Name: ${result.bankName}\nBeneficiary: ${result.beneficiary}\nBeneficiary Address: ${result.beneficiaryAddress}\nIBAN: ${result.iban}\nBank Country: ${result.bankCountry}\nBank Account Currency: ${result.bankAccountCurrency}\nSWIFT/BIC: ${result.swiftOrBic}`;
            }
            return "";
        }

        const pdfFileName = "invoice.pdf";
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(pdfFileName);
        doc.pipe(writeStream);

        // Header
        doc.fontSize(20).text("INVOICE", 50, 50);

        // Sender's details
        doc.fontSize(10).text(result.beneficiary, 50, 100);
        doc.text(result.street, 50, 115);
        doc.text(result.city + " " + result.country, 50, 130);

        // Date and Invoice Number
        doc.text(`DATE: ${getFormattedDate()}`, 400, 100);
        doc.text(`INVOICE NO. ${result?._id}`, 400, 115);

        // Bill To
        doc.text("BILL TO", 50, 200);
        doc.text("TECHNO TV LTD", 50, 215);
        doc.text("Chamber of Commerce: 10458319", 50, 230);
        doc.text("Email Address: admin@soundinfluencers.com", 50, 245);
        doc.text("Phone number: +44 7537 129190", 50, 260);
        doc.text("124 City Road", 50, 275);
        doc.text("EC1V 2NX – London – England - UK", 50, 290);

        // Table headers
        doc.text("DESCRIPTION", 50, 330);
        doc.text("TOTAL", 250, 330);

        // Table content
        doc.text(result.beneficiary + " campaign", 50, 350);
        doc.text(result.amount + "€", 250, 350);

        // Payment details
        let currentY = 400;
        doc.text("SUBTOTAL:", 50, currentY);
        doc.text(result.amount + "€", 250, currentY);

        currentY += 15;
        doc.text("BALANCE DUE:", 50, currentY);
        doc.text(result.amount + "€", 250, currentY);

        currentY += 15;
        doc.text("Selected Payment Method: " + result.selectedPaymentMethod, 50, currentY);

        currentY += 15;
        doc.text(getPaymentMethod(), 50, currentY, { width: 500, continued: false });

        currentY = doc.y + 20;
        doc.text("Payment Terms: Within 7 business days", 50, currentY);

        doc.end();

        return new Promise((resolve, reject) => {
            writeStream.on("finish", () => resolve("invoice.pdf"));
            writeStream.on("error", reject);
        });
    }

    async getInvoiceDetails(id: string) {
        try {
            if (!id) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            const checkUser = await this.invoiceDetailsModel.findOne({id: id});

            if (!checkUser) {
                return {
                    code: 404,
                    message: "invoice details not found",
                };
            }

            return {
                code: 200,
                invoiceDetails: checkUser,
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async createInvoice(data: CreateInvoiceDtoDto) {
        try {
            const checkUser = await this.influencerModel.findOne({
                _id: data.influencerId,
            });

            if (!checkUser) {
                return {
                    code: 404,
                    message: "influencer not found",
                };
            }

            await this.influencerModel.findByIdAndUpdate(
                {_id: data.influencerId},
                {balance: +checkUser.balance - data.amount}
            );
            data.description = "Payment Due: 7 days (subject to approval)";
            const result = await this.invoicesModel.create({
                ...data,
                status: "Submitted",
            });
            const findSaveData = await this.saveInvoiceDataModel.findOne({
                influencerId: data.influencerId,
            });
            if (findSaveData) {
                await this.saveInvoiceDataModel.findByIdAndUpdate(
                    {_id: findSaveData._id},
                    data
                );
            } else {
                await this.saveInvoiceDataModel.create(data);
            }

            const instagramAccounts = checkUser.spotify.map((account) => {
                return `${account.instagramUsername} `;
            });

            await this.createPDF(result, data)
                .then(async (pdfPath) => {
                    await sendMail(
                        "admin@soundinfluencers.com",
                        // "nazarkozynets030606@zohomail.eu",
                        `${checkUser.email}`,
                        `Invoice from ${data.contactEmail} (${data.contactName}) ID: ${result?._id} Instagram Accounts: ${instagramAccounts} Selected Payment Method: ${data.selectedPaymentMethod}`,
                        "pdf",
                        pdfPath as string
                    );

                    await sendMail(
                        checkUser.email,
                        "soundinfluencers",
                        `<p>Hello</p>
        <p>We acknowledge the receipt of your invoice. If everything is in order, we will process the payment to your details within the next 7 days.
        </p></br></br>
        <p>Bests</br>
        Sound Influencers Team
        </p>
        `,
                        "html"
                    );
                })
                .catch((error) => {
                    console.error("Error creating PDF:", error);
                });
            return {
                code: 201,
                result,
            };
        } catch (err) {
            console.log(err);
        }
    }

    async getInvoices(influencerId: string) {
        if (!influencerId) {
            return {
                status: 400,
                message: "Not enough arguments",
            };
        }

        try {
            const result = await this.invoicesModel.find({
                influencerId: influencerId,
            });
            return {
                code: 200,
                invoices: result,
            };
        } catch (err) {
            console.log();
        }
    }

    async getInvoiceSave(influencerId: string) {
        if (!influencerId) {
            return {
                status: 400,
                message: "Not enough arguments",
            };
        }

        try {
            const result = await this.saveInvoiceDataModel.findOne({
                influencerId: influencerId,
            });
            if (result) {
                return {
                    code: 200,
                    invoice: result,
                };
            } else {
                return {
                    code: 404,
                    message: "not found",
                };
            }
        } catch (err) {
            console.log();
        }
    }

    async downloadInvoice(invoiceId: string, res: Response) {
        try {
            const invoiceData = await this.invoicesModel.findById(invoiceId);

            if (!invoiceData) {
                return res.status(404).send('Invoice not found');
            }

            const pdfFilePath = await this.createPDF(invoiceData, {});

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoiceId}.pdf`);

            const fileStream = fs.createReadStream(pdfFilePath);

            fileStream.pipe(res);

            fileStream.on('end', () => {
                fs.unlinkSync(pdfFilePath);
            });

        } catch (error) {
            console.error('Error while generating or sending invoice:', error);
            res.status(500).send('An error occurred while downloading the invoice');
        }
    }
}