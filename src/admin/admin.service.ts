import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Promos} from "../promos/schemas/promo.schema";
import mongoose, {Types} from "mongoose";
import {Client} from "../auth/schemas/client.schema";
import {Influencer} from "../auth/schemas/influencer.schema";
import {Offers} from "../promos/schemas/offers.schema";
import {AdminUpdatePersonalClientDto} from "./dto/admin-update-client.dto";
import {AdminUpdateInfluencerPersonalDto} from "./dto/admin-update-influencer-personal.dto";
import {AdminUpdateInfluencerInstagramDto} from "./dto/admin-update-influencer-instagram.dto";
import {Invoices} from "../invoice/schemas/invoices.schema";
import {AdminUpdateInfluencerInvoiceDto} from "./dto/admin-update-influencer-invoice.dto";
import {Payment} from "../payment/schemas/payment.entity";
import {AdminUpdateClientPayment} from "./dto/admin-update-client-payment.update";
import sendMail from "../utils/sendMail";
import {AdminUpdatePromoDto} from "./dto/admin-update-promo.dto";
import {AdminUpdatePromoVideoDto} from "./dto/admin-update-promo-video.dto";
import {AdminUpdatePromoInfluencersDto} from "./dto/admin-update-promo-influencers.dto";
import {AdminAddInfluencerToCampaignDto} from "./dto/admin-add-influencer-to-campaign.dto";
import {AdminSendEmailToInfluencerDto} from "./dto/admin-send-email-to-influencer.dto";
import {OffersTemp, OffersTempSchema} from "./schemas/offers-temp.schema";
import {AdminSaveOffersToTempDto} from "./dto/admin-save-offer-to-temp.dto";
import {AdminPutOfferToOffersDto} from "./dto/admin-put-offer-to-offers.dto";
import {PromosService} from "../promos/promos.service";

const fs = require("fs");
const PDFDocument = require("pdfkit");

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(Promos.name)
        private promosModel: mongoose.Model<Promos>,
        @InjectModel(Client.name)
        private clientModel: mongoose.Model<Client>,
        @InjectModel(Influencer.name)
        private influencerModel: mongoose.Model<Influencer>,
        @InjectModel(Offers.name)
        private offersModel: mongoose.Model<Offers>,
        @InjectModel(Invoices.name)
        private invoicesModel: mongoose.Model<Invoices>,
        @InjectModel(Payment.name)
        private paymentModel: mongoose.Model<Payment>,
        @InjectModel(OffersTemp.name)
        private offersTempModel: mongoose.Model<OffersTemp>,
    ) {
    }

    async createPDF(data: any) {
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream("invoice.pdf");
        doc.pipe(writeStream);

        // Header
        doc.fontSize(20).text("INVOICE", 50, 50);

        // Sender's details
        doc.fontSize(10).text(data.fromCompanyName, 50, 100);
        doc.text(data.address, 50, 115);
        doc.text(data.townCountry, 50, 130);
        doc.text("Chamber of Commerce: " + data.chamberOfCommerce, 50, 145);
        doc.text("Email Address: " + data.email, 50, 160);
        doc.text("Phone number: " + data.phone, 50, 175);


        // Date and Invoice Number
        doc.text(`DATE: ${data.date}`, 400, 100);
        doc.text(`INVOICE NO. ${data.invoiceNo}`, 400, 115);

// Bill To
        doc.text("BILL TO", 50, 240);
        doc.text(data.companyName, 50, 255);
// Table headers
        doc.text("DESCRIPTION", 50, 350);
        doc.text("TOTAL", 250, 350);

// Table content
        doc.text("Instagram Promotion", 50, 365);
        doc.text(data.total + "€", 250, 365);

// Payment details
        doc.text("SUBTOTAL:", 50, 400);
        doc.text(data.subtotal + "€", 250, 400);
        doc.text("BALANCE DUE:", 50, 415);
        doc.text(data.balanceDue + "€", 250, 415);


        // Payment method and terms
        doc.text("Payment Terms: Within 7 business days", 50, 465);

        doc.end();

        return new Promise((resolve, reject) => {
            writeStream.on("finish", () => resolve("invoice.pdf"));
            writeStream.on("error", reject);
        });
    }

    async adminGetClients() {
        try {
            const getClientsAll = await this.clientModel
                .find({statusVerify: 'accept'})
                .select(['-password'])
                .lean()
                .exec();

            const clients = [];

            for (const client of getClientsAll) {
                const campaignsCompleted = await this.promosModel.countDocuments({
                    userId: client._id,
                    statusPromo: 'finally'
                }).exec();

                const campaignsDenied = await this.promosModel.countDocuments({
                    userId: client._id,
                    selectInfluencers: {
                        $elemMatch: {
                            confirmation: {$ne: 'accept'}
                        }
                    }
                }).exec();

                const campaignsOngoing = await this.promosModel.countDocuments({
                    userId: client._id,
                    statusPromo: 'work'
                }).exec();

                const latestCampaign = await this.promosModel.find({
                    userId: client._id
                }).sort({createdAt: -1}).limit(1).lean().exec();

                clients.push({
                    ...client,
                    campaignsCompleted,
                    campaignsDenied,
                    campaignsOngoing,
                    latestCampaign: latestCampaign[0],
                });
            }

            return {
                code: 200,
                data: clients
            };

        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async adminUpdateClient(data: AdminUpdatePersonalClientDto) {
        try {
            if (!data) {
                return {
                    status: 400,
                    message: 'Not enough arguments',
                };
            }
            const checkUser = await this.clientModel.findOne({_id: data.id});

            if (!checkUser) {
                return {
                    code: 404,
                    message: 'User not found',
                };
            }

            await this.clientModel.findOneAndUpdate(
                {_id: data.id},
                {
                    ...data
                },
            );

            return {
                code: 200,
                message: 'personal data update',
            };
        } catch (err) {
            return {
                status: 500,
                message: err,
            };
        }
    }

    async adminGetAllInfluencerInstaAccounts() {
        try {
            const influencers = await this.influencerModel
                .find({statusVerify: 'accept'})
                .select(['-password'])
                .lean()
                .exec();

            if (!influencers || influencers.length === 0) {
                return {
                    status: 404,
                    message: 'No influencers found',
                };
            }

            const influencerAvatars = {};
            const instagrams = [];
            influencers.forEach((influencer) => {
                influencer.instagram.forEach((insta) => {
                    const username = String(insta.instagramUsername).trim();
                    if (username && this.isValidUTF8(username)) {
                        influencerAvatars[influencer._id] = influencerAvatars[influencer._id] || {};
                        influencerAvatars[influencer._id][username] = insta.logo;

                        instagrams.push({
                            instagram: insta,
                            influencerId: influencer._id,
                            firstName: influencer.firstName,
                            phone: influencer.phone,
                            balance: influencer.balance,
                            email: influencer.email,
                            avatar: influencerAvatars[influencer._id][username],
                            internalNote: influencer.internalNote,
                            latestInvoice: null,
                            campaignsCompleted: 0,
                            campaignsDenied: 0
                        });
                    }
                });
            });

            const influencerIds = influencers.map((inf) => inf._id);

            const latestInvoices = await this.invoicesModel
                .find({influencerId: {$in: influencerIds}})
                .sort({createdAt: -1})
                .lean()
                .exec();

            const promoData = await this.promosModel
                .aggregate([
                    {$unwind: "$selectInfluencers"},
                    {
                        $match: {
                            "selectInfluencers.instagramUsername": {$in: instagrams.map(insta => insta.instagram.instagramUsername)}
                        }
                    },
                    {
                        $group: {
                            _id: "$selectInfluencers.instagramUsername",
                            campaignsCompleted: {
                                $sum: {$cond: [{$and: [{$eq: ["$selectInfluencers.confirmation", "accept"]}, {$eq: ["$selectInfluencers.closePromo", "close"]}]}, 1, 0]}
                            },
                            campaignsDenied: {
                                $sum: {$cond: [{$ne: ["$selectInfluencers.confirmation", "accept"]}, 1, 0]}
                            }
                        }
                    }
                ])
                .exec();

            const invoiceMap = Object.fromEntries(latestInvoices.map(inv => [inv.influencerId.toString(), inv]));
            const promoMap = Object.fromEntries(promoData.map(promo => [promo._id, promo]));

            instagrams.forEach(insta => {
                insta.latestInvoice = invoiceMap[insta.influencerId] || "No Invoice";
                insta.campaignsCompleted = promoMap[insta.instagram.instagramUsername]?.campaignsCompleted || 0;
                insta.campaignsDenied = promoMap[insta.instagram.instagramUsername]?.campaignsDenied || 0;
            });

            return {
                status: 200,
                data: instagrams,
            };

        } catch (err) {
            console.error('Error occurred:', err);
            return {
                status: 500,
                message: err.message || 'An unknown error occurred',
            };
        }
    }

    async isValidUTF8(str) {
        try {
            decodeURIComponent(escape(str));
            return true;
        } catch (e) {
            return false;
        }
    }

    async adminUpdatePersonalInfluencer(data: AdminUpdateInfluencerPersonalDto) {
        try {
            if (!data) {
                return {
                    status: 400,
                    message: 'Not enough arguments',
                };
            }
            const checkUser = await this.influencerModel.findOne({_id: data.id});

            if (!checkUser) {
                return {
                    code: 404,
                    message: 'User not found',
                };
            }

            await this.influencerModel.findOneAndUpdate(
                {_id: data.id},
                {
                    ...data
                },
            );

            return {
                code: 200,
                message: 'personal data update',
            };
        } catch (err) {
            return {
                status: 500,
                message: err,
            };
        }
    }

    async adminUpdateInfluencerInstagram(data: AdminUpdateInfluencerInstagramDto) {
        try {
            if (!data) {
                return {
                    status: 400,
                    message: 'Not enough arguments',
                };
            }

            const checkUser = await this.influencerModel.findOne({_id: data.influencerId});

            if (!checkUser) {
                return {
                    code: 404,
                    message: 'User not found',
                };
            }

            const checkInstagram = checkUser.instagram.find((insta) => insta.instagramUsername === data.instagramUsername);

            if (!checkInstagram) {
                return {
                    code: 404,
                    message: 'Instagram not found',
                };
            }

            await this.influencerModel.findOneAndUpdate(
                {
                    _id: data.influencerId,
                    'instagram.instagramUsername': data.instagramUsername
                },
                {
                    $set: {
                        'instagram.$.instagramLink': data.instagramLink,
                        'instagram.$.followersNumber': data.followersNumber,
                        'instagram.$.price': data.price,
                        'instagram.$.publicPrice': data.publicPrice,
                    }
                },
            );
        } catch (err) {
            return {
                status: 500,
                message: err,
            };
        }
    }

    async adminGetOneInfluencerInstaAccount(influencerId: string, instagramUsername: string) {
        try {
            const influencer = await this.influencerModel.findOne({_id: influencerId}).lean().exec();

            if (!influencer) {
                return {
                    status: 404,
                    message: 'Influencer not found',
                };
            }

            const instagram = influencer.instagram.find((insta) => insta.instagramUsername === instagramUsername);

            if (!instagram) {
                return {
                    status: 404,
                    message: 'Instagram not found',
                };
            }

            const influencerAvatar = instagram.logo;

            const result = {
                instagram: {
                    instagramUsername: instagram.instagramUsername,
                    instagramLink: instagram.instagramLink,
                    followersNumber: instagram.followersNumber,
                    price: instagram.price,
                    publicPrice: instagram.publicPrice,
                    logo: instagram.logo,
                    musicStyle: instagram.musicStyle,
                    musicSubStyles: instagram.musicSubStyles,
                    countries: instagram.countries,
                    categories: instagram.categories,
                    isHidden: instagram.isHidden,
                },
                influencerId: influencer._id,
                firstName: influencer.firstName,
                phone: influencer.phone,
                balance: influencer.balance,
                email: influencer.email,
                avatar: influencerAvatar,
                internalNote: influencer.internalNote,
            };

            return {
                status: 200,
                data: result,
            };

        } catch (err) {
            console.error('Error occurred:', err);
            return {
                status: 500,
                message: err.message || 'An unknown error occurred',
            };
        }
    }

    async adminGetAllInvoices() {
        try {
            const invoices = await this.invoicesModel
                .find()
                .sort({createdAt: -1})
                .lean()
                .exec();

            if (!invoices || invoices.length === 0) {
                return {
                    status: 404,
                    message: 'No invoices found',
                };
            }

            const validInvoices = invoices.filter(invoice => {
                try {
                    return Object.values(invoice).every(value =>
                        typeof value !== 'string' || this.isValidUTF8(value)
                    );
                } catch (err) {
                    console.warn(`Skipping invoice due to error:`, err);
                    return false;
                }
            });

            if (validInvoices.length === 0) {
                return {
                    status: 404,
                    message: 'No valid invoices found',
                };
            }

            return {
                status: 200,
                data: validInvoices,
            };

        } catch (err) {
            console.error('Error occurred:', err);
            return {
                status: 500,
                message: err.message || 'An unknown error occurred',
            };
        }
    }

    async adminUpdateInfluencerInvoice(data: AdminUpdateInfluencerInvoiceDto) {
        try {
            if (!data) {
                return {
                    status: 400,
                    message: 'Not enough arguments',
                };
            }

            const checkInvoice = await this.invoicesModel.findOne({_id: data._id});

            if (!checkInvoice) {
                return {
                    code: 404,
                    message: 'Invoice not found',
                };
            }

            await this.invoicesModel.findOneAndUpdate(
                {_id: data._id},
                {
                    ...data
                },
            );

            return {
                code: 200,
                message: 'Invoice update',
            };

        } catch (err) {
            return {
                status: 500,
                message: err,
            }
        }
    }

    async adminGetOneInfluencerInvoice(invoiceId: string) {
        try {
            const invoice = await this.invoicesModel.findOne({_id: invoiceId}).lean().exec();

            if (!invoice) {
                return {
                    status: 404,
                    message: 'Invoice not found',
                };
            }

            return {
                status: 200,
                data: invoice,
            };
        } catch (err) {
            return {
                status: 500,
                message: err,
            };
        }
    }

    async adminGetAllClientsPayments() {
        try {
            const payments = await this.paymentModel
                .find()
                .sort({createdAt: -1})
                .lean()
                .exec();

            if (!payments || payments.length === 0) {
                return {
                    status: 404,
                    message: 'No payments found',
                };
            }

            const result = await Promise.all(payments.map(async (payment) => {
                const user = await this.clientModel.findOne({_id: payment.userId}).lean().exec();
                return {
                    ...payment,
                    companyName: user.company,
                };
            }));

            return {
                status: 200,
                data: result,
            };

        } catch (err) {
            console.error('Error occurred:', err);
            return {
                status: 500,
                message: err.message || 'An unknown error occurred',
            };
        }
    }

    async adminUpdateClientPayment(data: AdminUpdateClientPayment) {
        try {
            if (!data) {
                return {
                    status: 400,
                    message: 'Not enough arguments',
                };
            }

            const checkPayment = await this.paymentModel.findOne({_id: data._id});

            if (!checkPayment) {
                return {
                    code: 404,
                    message: 'Payment not found',
                };
            }

            await this.paymentModel.findOneAndUpdate(
                {_id: data._id},
                {
                    ...data
                },
            );

            const user = await this.clientModel.findOne({_id: data.userId}).lean().exec();

            await this.clientModel.findOneAndUpdate(
                {_id: data.userId},
                {
                    company: data.companyName
                },
            );

            // if (!user) {
            //     return {
            //         code: 404,
            //         message: 'User not found',
            //     };
            // }

            return {
                code: 200,
                message: 'Payment update',
            };

        } catch (err) {
            return {
                status: 500,
                message: err,
            }
        }
    }

    async adminGetOneClientPayment(_id: string) {
        try {
            const payment = await this.paymentModel.findOne({_id}).lean().exec();

            if (!payment) {
                return {
                    status: 404,
                    message: 'Payment not found',
                };
            }

            const user = await this.clientModel.findOne({_id: payment.userId}).lean().exec();

            return {
                status: 200,
                data: {
                    ...payment,
                    companyName: user.company,
                },
            };
        } catch (err) {
            return {
                status: 500,
                message: err,
            };
        }
    }

    async adminSendNewInvoiceToClient(data: any) {
        try {
            const user = await this.clientModel.findOne({_id: data.userId}).lean().exec();

            if (!user) {
                return {
                    status: 404,
                    message: 'User not found',
                };
            }

            await this.createPDF(data).then(async (path) => {
                const emailToSend = user.email;

                await sendMail(
                    emailToSend,
                    "Invoice",
                    `<p>Hello,</p>
          <p>Please find attached the invoice for your SoundInfluencers campaign.</p><br/>
          <p> To monitor the progress of your campaign, please visit the <a href="https://go.soundinfluencers.com/account/client/ongoing-promos">"Ongoing Promo"</a>  section in the homepage in <a href="https://go.soundinfluencers.com">go.soundinfluencers.com</a></p><br/>
          <p>Best regards,
          SoundInfluencers Team</p>`,
                    "pdf",
                    path as string
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

    async adminGetAllPromos() {
        try {
            const promos = await this.promosModel.find().sort({createdAt: -1}).lean().exec();

            if (!promos || promos.length === 0) {
                return {
                    status: 404,
                    message: 'No promos found',
                };
            }

            const result = await Promise.all(promos.map(async (promo) => {
                let totalFollowers = 0;

                if (Array.isArray(promo.selectInfluencers)) {
                    const influencersInstagramUsernames = promo.selectInfluencers.map(influencer => influencer.instagramUsername);

                    const influencers = await this.influencerModel.find({
                        'instagram.instagramUsername': {$in: influencersInstagramUsernames}
                    }).lean().exec();

                    promo.selectInfluencers.forEach(promoInfluencer => {
                        const influencer = influencers.find(inf =>
                            inf.instagram.some(insta => insta.instagramUsername === promoInfluencer.instagramUsername)
                        );

                        if (influencer) {
                            const insta = influencer.instagram.find(instaAccount => instaAccount.instagramUsername === promoInfluencer.instagramUsername);

                            if (insta) {
                                const followersCount = insta.followersNumber.replace(/[\s,]/g, '');
                                totalFollowers += parseInt(followersCount, 10);

                                const cleanedPrice = insta.price.replace(/[^\d]/g, '');
                                const cleanedPublicPrice = insta.publicPrice.replace(/[^\d]/g, '');

                                Object.assign(promoInfluencer, {
                                    price: parseInt(cleanedPrice, 10),
                                    publicPrice: parseInt(cleanedPublicPrice, 10),
                                });
                            }
                        }
                    });
                }

                return {
                    ...promo,
                    totalFollowers,
                };
            }));

            return {
                status: 200,
                data: result,
            };
        } catch (err) {
            console.error('Error occurred:', err);
            return {
                status: 500,
                message: err.message || 'An unknown error occurred',
            };
        }
    }

    async adminDeletePromo(promoId: string) {
        try {
            const promo = await this.promosModel.findOne({_id: promoId});

            if (!promo) {
                return {
                    status: 404,
                    message: 'Promo not found',
                };
            }

            await this.promosModel.deleteOne({_id: promoId});

            return {
                status: 200,
                message: 'Promo deleted successfully',
            };
        } catch (err) {
            console.error('Error deleting promo:', err);
            return {
                status: 500,
                message: err.message || 'An error occurred while deleting the promo',
            };
        }
    }

    async adminClosePromoForInfluencer(promoId: string, instagramUsername: string) {
        try {
            const promo = await this.promosModel.findOne({_id: promoId});

            if (!promo) {
                return {
                    status: 404,
                    message: 'Promo not found',
                };
            }

            const influencer = promo.selectInfluencers.find(
                (influencer) => influencer.instagramUsername === instagramUsername
            );

            if (!influencer) {
                return {
                    status: 404,
                    message: 'Influencer not found in promo',
                };
            }

            const influencerAccount = await this.influencerModel
                .findOne({
                    'instagram.instagramUsername': instagramUsername
                })
                .lean()
                .exec();

            if (!influencerAccount) {
                return {
                    status: 404,
                    message: 'Influencer account not found',
                };
            }

            influencer.closePromo = 'close';
            await promo.save();

            const price = influencerAccount.instagram.find(
                (insta) => insta.instagramUsername === instagramUsername
            )?.price;

            if (!price) {
                return {
                    status: 400,
                    message: 'Price not found for influencer',
                };
            }

            let balance = parseInt(influencerAccount.balance.replace('€', '').trim(), 10);

            if (isNaN(balance)) {
                balance = 0;
            }

            balance += parseInt(price.replace('€', '').trim(), 10);

            const updatedBalance = `${balance}`;

            await this.influencerModel.findOneAndUpdate(
                {'instagram.instagramUsername': instagramUsername},
                {balance: updatedBalance}
            );

            return {
                status: 200,
                message: 'Promo closed for influencer successfully',
            };
        } catch (err) {
            console.error('Error closing promo for influencer:', err);
            return {
                status: 500,
                message: err.message || 'An error occurred while closing the promo for the influencer',
            };
        }
    }

    async adminSendCampaignPublicLinkToClient(userId: string, publicLink: string) {
        try {
            const user = await this.clientModel.findOne({_id: userId}).lean().exec();
            if (!user) {
                return {
                    status: 404,
                    message: 'User not found',
                };
            }

            const emailToSend = user.email;
            await sendMail(
                emailToSend,
                "Campaign Public Link",
                `Hello,
            Here is the public link to campaign: ${publicLink},
            Best regards,
            SoundInfluencers Team`,
            );
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

    async adminGetOnePromo(promoId: string) {
        try {
            const promo: any = await this.promosModel.findOne({_id: promoId}).lean().exec();

            if (!promo) {
                return {
                    status: 404,
                    message: 'Promo not found',
                };
            }

            let totalFollowers = 0;

            if (Array.isArray(promo.selectInfluencers)) {
                const influencersInstagramUsernames = promo.selectInfluencers.map(influencer => influencer.instagramUsername);

                const influencers = await this.influencerModel.find({
                    'instagram.instagramUsername': {$in: influencersInstagramUsernames}
                }).lean().exec();

                promo.selectInfluencers.forEach((promoInfluencer: any) => { // Используем any
                    const influencer = influencers.find(inf =>
                        inf.instagram.some(insta => insta.instagramUsername === promoInfluencer.instagramUsername)
                    );

                    if (influencer) {
                        const insta = influencer.instagram.find(instaAccount => instaAccount.instagramUsername === promoInfluencer.instagramUsername);

                        if (insta) {
                            const followersCount = insta.followersNumber.replace(/[\s,]/g, '');
                            promoInfluencer.followersCount = parseInt(followersCount, 10);
                            totalFollowers += promoInfluencer.followersCount;
                        } else {
                            promoInfluencer.followersCount = 0;
                        }
                    } else {
                        promoInfluencer.followersCount = 0;
                    }
                });
            }

            return {
                status: 200,
                data: {
                    ...promo,
                    totalFollowers,
                },
            };
        } catch (err) {
            return {
                status: 500,
                message: err,
            };
        }
    }

    async adminUpdatePromo(data: AdminUpdatePromoDto) {
        try {
            if (!data) {
                return {
                    status: 400,
                    message: 'Not enough arguments',
                };
            }

            const checkPromo = await this.promosModel.findOne({_id: data._id});

            if (!checkPromo) {
                return {
                    code: 404,
                    message: 'Promo not found',
                };
            }

            await this.promosModel.findOneAndUpdate(
                {_id: data._id},
                {
                    ...data
                },
            );

            return {
                code: 200,
                message: 'Promo update',
            };

        } catch (err) {
            return {
                status: 500,
                message: err,
            }
        }
    }

    async adminGivePartialRefundToClient(userId: string, partialRefund: number, campaignId: string) {
        try {
            const campaign = await this.promosModel.findOne({_id: campaignId});

            if (!campaign) {
                return {
                    code: 404,
                    message: 'Campaign not found',
                };
            }

            campaign.partialRefund = 0;
            await campaign.save();

            const client = await this.clientModel.findOne({_id: userId});

            if (!client) {
                return {
                    code: 404,
                    message: 'Client not found',
                };
            }

            client.balance += partialRefund;

            await client.save();

            return {
                code: 200,
                message: 'Partial refund given',
            };
        } catch (err) {
            console.log(err);

            return {
                code: 500,
                message: err.message || 'An error occurred',
            };
        }
    }

    async adminUpdatePromoVideo(data: AdminUpdatePromoVideoDto) {
        try {
            const promo = await this.promosModel.findOne({_id: data._id});
            if (!promo) {
                return {
                    status: 404,
                    message: 'Promo not found',
                };
            }

            const video = promo.videos.find((video) => video._id === data.videoId);

            if (data.newVideoLink) {
                const influencer = promo.selectInfluencers.find((influencer) => influencer.instagramUsername === data.selectedInstagramUsername);

                if (!influencer) {
                    return {
                        status: 404,
                        message: 'Influencer not found',
                    };
                }

                if (influencer) {
                    influencer.selectedVideo = data.newVideoLink;
                }
            }

            if (video && data.newVideoLink && data.isNewVideo) {
                video.videoLink = data.newVideoLink;
            }
            video.postDescription = data.postDescription;
            video.storyTag = data.storyTag;
            video.swipeUpLink = data.swipeUpLink;
            video.specialWishes = data.specialWishes;
            
            await promo.save();

            return {
                status: 200,
                message: 'Promo video updated',
            };
        } catch (err) {
            console.error('Error updating promo video:', err);
            return {
                status: 500,
                message: err.message || 'An error occurred while updating the promo video',
            };
        }
    }

    async adminUpdateInfluencersListPromo(data: AdminUpdatePromoInfluencersDto) {
        try {
            const promo = await this.promosModel.findOne({_id: data.promoId});

            if (!promo) {
                return {
                    status: 404,
                    message: 'Promo not found',
                };
            }

            const influencerIndex = promo.selectInfluencers.findIndex(
                (influencer) => influencer.instagramUsername === data.instagramUsername
            );

            if (influencerIndex === -1) {
                return {
                    status: 404,
                    message: 'Influencer not found in promo',
                };
            }

            if (data.datePost) {
                promo.selectInfluencers[influencerIndex].datePost = data.datePost;
            }
            if (data.impressions) {
                promo.selectInfluencers[influencerIndex].impressions = data.impressions;
            }
            if (data.like) {
                promo.selectInfluencers[influencerIndex].like = data.like;
            }
            if (data.screenshot) {
                promo.selectInfluencers[influencerIndex].screenshot = data.screenshot;
            }
            if (data.postLink) {
                promo.selectInfluencers[influencerIndex].postLink = data.postLink;
            }

            await promo.save();

            return {
                status: 200,
                message: 'Influencer data updated successfully',
            };
        } catch (err) {
            console.error('Error updating promo influencers:', err);
            return {
                status: 500,
                message: err.message || 'An error occurred while updating the promo influencers',
            };
        }
    }

    async adminRemoveInfluencerFromPromo(promoId: string, instagramUsername: string) {
        try {
            const promo = await this.promosModel.findOne({_id: promoId});

            if (!promo) {
                return {
                    status: 404,
                    message: 'Promo not found',
                };
            }

            const influencerIndex = promo.selectInfluencers.findIndex(
                (influencer) => influencer.instagramUsername === instagramUsername
            );

            if (influencerIndex === -1) {
                return {
                    status: 404,
                    message: 'Influencer not found in promo',
                };
            }

            promo.selectInfluencers.splice(influencerIndex, 1);

            await promo.save();

            return {
                status: 200,
                message: 'Influencer removed from promo successfully',
            };
        } catch (err) {
            console.error('Error removing influencer from promo:', err);
            return {
                status: 500,
                message: err.message || 'An error occurred while removing the influencer from the promo',
            };
        }
    }

    async adminAddInfluencerToPromo(data: AdminAddInfluencerToCampaignDto) {
        try {
            const promo = await this.promosModel.findOne({_id: data._id});
            if (!promo) {
                return {
                    status: 404,
                    message: 'Promo not found',
                };
            }

            const influencer = await this.influencerModel.findOne({_id: data.influencerId});

            if (!influencer) {
                return {
                    status: 404,
                    message: 'Influencer not found',
                };
            }

            const existingInfluencer = promo.selectInfluencers.find(
                (influencer) => influencer.instagramUsername === data.instagramUsername
            );

            if (existingInfluencer) {
                return {
                    status: 400,
                    message: 'Influencer already added to promo',
                };
            }

            promo.selectInfluencers.push({
                _id: new Types.ObjectId().toString(),
                influencerId: data.influencerId,
                amount: data.amount,
                instagramUsername: data.instagramUsername,
                confirmation: 'wait',
                selectedVideo: data.selectedVideo,
                dateRequest: data.dateRequest,
                closePromo: 'wait',
                brand: '',
                datePost: '',
                caption: '',
                video: '',
                postLink: '',
                screenshot: '',
                impressions: '',
                reach: '',
                like: '',
                invoice: '',
            });

            if (!promo.videos.some(video => video.videoLink === data.selectedVideo)) {
                const newVideo = {
                    _id: new Types.ObjectId().toString(),
                    videoLink: data.selectedVideo,
                    postDescription: '',
                    storyTag: '',
                    swipeUpLink: '',
                    specialWishes: '',
                };
                promo.videos.push(newVideo);
            }

            await promo.save();

            return {
                status: 200,
                message: 'Influencer added to promo successfully',
            };
        } catch (err) {
            console.error('Error adding influencer to promo:', err);
            return {
                status: 500,
                message: err.message || 'An error occurred while adding the influencer to the promo',
            };
        }
    }

    async adminAddInfluencerToTempList(promoId: string, instagramUsername: string) {
        try {
            const promo = await this.promosModel.findOne({_id: promoId});

            if (!promo) {
                return {
                    status: 404,
                    message: 'Promo not found',
                };
            }

            const influencer = await this.influencerModel.findOne({
                'instagram.instagramUsername': {$regex: `^${instagramUsername}$`, $options: 'i'}
            });
            const instaFollowers = influencer.instagram.find((insta) => insta.instagramUsername.toLowerCase() === instagramUsername.toLowerCase()).followersNumber;
            const instaUsername = influencer.instagram.find((insta) => insta.instagramUsername.toLowerCase() === instagramUsername.toLowerCase()).instagramUsername;

            if (!influencer) {
                return {
                    status: 404,
                    message: 'Influencer not found',
                };
            }

            const existingInfluencer = promo.selectInfluencers.find(
                (influencer) => influencer.instagramUsername.toLowerCase() === instagramUsername.toLowerCase()
            );

            if (existingInfluencer) {
                return {
                    status: 400,
                    message: 'Influencer already added to promo',
                };
            }

            const influencerObj = {
                _id: new Types.ObjectId().toString(),
                influencerId: influencer._id.toString(),
                amount: 0,
                instagramUsername: instaUsername,
                confirmation: 'wait',
                selectedVideo: '',
                dateRequest: '',
                closePromo: 'wait',
                brand: '',
                datePost: '',
                caption: '',
                video: '',
                postLink: '',
                screenshot: '',
                impressions: '',
                reach: '',
                like: '',
                invoice: '',
            };

            return {
                status: 200,
                data: {
                    ...influencerObj,
                    followersCount: instaFollowers,
                },
            };
        } catch (err) {
            console.error('Error adding influencer to promo:', err);
            return {
                status: 500,
                message: err.message || 'An error occurred while adding the influencer to the promo',
            };
        }
    }

    async adminSendEmailToInfluencer(data: AdminSendEmailToInfluencerDto) {
        const emailToInfluencer = `
Hi,
You have received a new promo request on your account for the following:
${data.instagramUsername} - Instagram Post & Story
Post Details:
  
     Link:${data.videoLink || 'No link provided'}
     Post Description: ${data.postDescription || 'No description provided'}
     Story Tag: ${data.storyTag || 'No story tag provided'}
     Swipe Up Link: ${data.storyLink || 'No post link provided'}
   
Access your account to accept or deny it here: https://go.soundinfluencers.com/account/influencer/new-promos     
Thanks,
Soundinfluencers Team
`;

        try {
            const influencer = await this.influencerModel.findOne({_id: data.influencerId});
            if (!influencer) {
                return {
                    status: 404,
                    message: 'Influencer not found',
                };
            }
            const emailToSend = influencer.email;
            await sendMail(
                emailToSend,
                "New Promo Request",
                emailToInfluencer,
            );
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

    async adminGetAllOffers() {
        try {
            const offersTempPromise = this.offersTempModel.find();

            const socialMediaTypes = ["instagram", "tiktok", "facebook", "youtube", "spotify", "soundcloud", "press"];
            const promosService = new PromosService(this.promosModel, this.clientModel, this.influencerModel, this.offersModel);

            const socialMediaPromises = socialMediaTypes.map(socialMedia => promosService.getOffers(socialMedia));
            const socialMediaResults = await Promise.all(socialMediaPromises);

            const socialMedias = socialMediaTypes.reduce((acc, socialMedia, index) => {
                acc[socialMedia] = socialMediaResults[index];
                return acc;
            }, {});

            const offersTemp = await offersTempPromise;

            return {
                status: 200,
                data: {
                    offersTemp,
                    socialMedias
                },
            };
        } catch (err) {
            console.error('Error occurred:', err);
            return {
                status: 500,
                message: err.message || 'An unknown error occurred',
            };
        }
    }


    async adminDeleteOfferAndSaveToTemp(data: AdminSaveOffersToTempDto) {
        try {
            const offer = await this.offersModel.findOne({_id: data._id});

            if (offer) await offer.deleteOne();

            const findOfferInTemp = await this.offersTempModel.findOne({_id: data._id});

            if (!findOfferInTemp) {
                const offersTemp = new this.offersTempModel(data);
                await offersTemp.save();

                return {
                    status: 200,
                    message: 'Offer deleted and saved to temp successfully',
                };
            } else {
                await this.offersTempModel.updateOne({_id: data._id}, {isDeleted: true});
            }
        } catch (err) {
            console.error('Error occurred:', err);
            return {
                status: 500,
                message: 'An unknown error occurred',
            };
        }
    }

    async adminSaveOffersToTemp(data: AdminSaveOffersToTempDto) {
        try {
            const existingOffer = await this.offersTempModel.findOne({_id: data._id});

            if (existingOffer) {
                await this.offersTempModel.updateOne({_id: data._id}, {...data});
                return {
                    status: 200,
                    message: 'Offer updated successfully',
                };
            } else {
                const offersTemp = new this.offersTempModel(data);
                await offersTemp.save();
                return {
                    status: 201,
                    message: 'Offer created successfully',
                };
            }
        } catch (err) {
            console.error('Error occurred:', err.message);
            console.error('Full error:', err);
            return {
                status: 500,
                message: `An error occurred: ${err.message}`,
            };
        }
    }

    async adminDeleteOffer(offerId: string) {
        try {
            let offer;
            offer = await this.offersTempModel.findById(offerId);

            if (!offer) {
                offer = await this.offersModel.findById(offerId);

                if (!offer) {
                    return {
                        status: 404,
                        message: 'Offer not found',
                    };
                }

            }

            await offer.deleteOne();

            return {
                status: 200,
                message: 'Offer deleted successfully',
            };
        } catch (err) {
            console.error('Error occurred:', err);
            return {
                status: 500,
                message: 'An unknown error occurred',
            };
        }
    }

    async adminReturnOfferFromDeleted(data: AdminPutOfferToOffersDto) {
        try {
            if (data.wasPublished) {
                const offer = await this.offersModel.findOne({_id: data._id});

                if (offer) {
                    return {
                        status: 400,
                        message: 'Offer already published',
                    };
                }

                await this.offersModel.create(data);
                await this.offersTempModel.deleteOne({_id: data._id});
            } else if (!data.wasPublished) {
                const offer = await this.offersTempModel.findOne({_id: data._id});

                if (!offer) {
                    return {
                        status: 400,
                        message: 'Offer not found',
                    };
                }

                await this.offersTempModel.updateOne({_id: data._id}, {isDeleted: false});
            }
        } catch (err) {
            console.error('Error occurred:', err);
            return {
                status: 500,
                message: 'An unknown error occurred',
            };
        }
    }

    async adminPublishOffers() {
        try {
            const offersTemp = await this.offersTempModel.find({isDeleted: false});

            if (!offersTemp || offersTemp.length === 0) {
                return {
                    status: 404,
                    message: 'No offers found',
                };
            }

            for (const offer of offersTemp) {
                const existingOffer = await this.offersModel.findOne({_id: offer._id});

                if (existingOffer) {
                    await this.offersModel.updateOne({_id: offer._id}, {...offer.toObject()});
                } else {
                    const newOffer = {
                        ...offer.toObject(),
                        _id: new Types.ObjectId()
                    };
                    await this.offersModel.create(newOffer);
                }
            }

            await this.offersTempModel.deleteMany({isDeleted: false});

            return {
                status: 200,
                message: 'Offers published successfully',
            };

        } catch (err) {
            console.error('Error occurred:', err);
            return {
                status: 500,
                message: 'An unknown error occurred',
            };
        }
    }

    async adminUpdateOldOffer(data: AdminSaveOffersToTempDto) {
        try {
            const offer = await this.offersModel.findOne({_id: data._id});

            if (offer) {
                await this.offersModel.deleteOne({_id: data._id});
                await this.offersTempModel.create({...data, isNew: true});

                return {
                    status: 200,
                    message: 'Offer updated successfully',
                };
            } else {
                const offerTemp = await this.offersTempModel.findOne({_id: data._id});

                if (!offerTemp) {
                    return {
                        status: 404,
                        message: 'Offer not found',
                    };
                }
                await this.offersTempModel.updateOne({_id: data._id}, {...data});

                return {
                    status: 200,
                    message: 'Offer updated successfully',
                };
            }
        } catch (err) {
            console.error('Error occurred:', err);
            return {
                status: 500,
                message: 'An unknown error occurred',
            };
        }
    }

    async adminHideInstagramAccount(influencerId, instagramUsername) {
        try {
            const influencer = await this.influencerModel.findOne({_id: influencerId});

            if (!influencer) {
                return {
                    status: 404,
                    message: 'Influencer not found',
                };
            }

            const instagram = influencer.instagram.find((insta) => insta.instagramUsername === instagramUsername);

            if (!instagram) {
                return {
                    status: 404,
                    message: 'Instagram account not found',
                };
            }

            instagram.isHidden = !instagram.isHidden;

            await influencer.save();

            return {
                status: 200,
                message: 'Instagram account hidden successfully',
            };
        } catch (err) {
            console.error('Error occurred:', err);
            return {
                status: 500,
                message: 'An unknown error occurred',
            };
        }
    }
    
    async hideCpmAndResultForCampaign(campaignId: string) {
        try {
            const campaign = await this.promosModel.findOne({_id: campaignId});

            if (!campaign) {
                return {
                    status: 404,
                    message: 'Campaign not found',
                };
            }

            campaign.isCpmAndResultHidden = !campaign.isCpmAndResultHidden;

            await campaign.save();

            return {
                status: 200,
                message: 'CPM and Result hidden successfully',
            };
        } catch (err) {
            console.error('Error occurred:', err);
            return {
                status: 500,
                message: 'An unknown error occurred',
            };
        }
    };
}