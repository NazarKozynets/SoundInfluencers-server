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
import {UpdatePhoneClientDto} from "../profile/dto/update-phone-client.dto";
import sendMail from "../utils/sendMail";
import {AdminUpdatePromoDto} from "./dto/admin-update-promo.dto";
import {AdminUpdatePromoVideoDto} from "./dto/admin-update-promo-video.dto";
import {AdminUpdatePromoInfluencersDto} from "./dto/admin-update-promo-influencers.dto";
import {AdminAddInfluencerToCampaignDto} from "./dto/admin-add-influencer-to-campaign.dto";

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
        private paymentModel: mongoose.Model<Payment>
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

            const instagrams = [];
            const influencerAvatars = {};

            influencers.forEach((influencer) => {
                try {
                    influencer.instagram.forEach((insta) => {
                        const username = String(insta.instagramUsername).trim();
                        if (username && this.isValidUTF8(username)) {
                            influencerAvatars[influencer._id] = influencerAvatars[influencer._id] || {};
                            influencerAvatars[influencer._id][username] = insta.logo;
                        }
                    });
                } catch (err) {
                    console.warn(`Skipping influencer ${influencer._id} due to error:`, err);
                }
            });

            const invoicePromises = influencers.map(async influencer => {
                try {
                    return await this.invoicesModel.findOne({influencerId: influencer._id})
                        .sort({createdAt: -1})
                        .lean()
                        .exec();
                } catch (err) {
                    console.warn(`Error fetching invoice for influencer ${influencer._id}:`, err);
                    return null; // Возвращаем null в случае ошибки
                }
            });

            const promoPromises = influencers.flatMap(influencer => {
                return influencer.instagram.map(async insta => {
                    try {
                        const completed = await this.promosModel.countDocuments({
                            selectInfluencers: {
                                $elemMatch: {
                                    instagramUsername: insta.instagramUsername,
                                    confirmation: 'accept',
                                    closePromo: 'close'
                                }
                            }
                        }).exec();

                        const denied = await this.promosModel.countDocuments({
                            selectInfluencers: {
                                $elemMatch: {
                                    instagramUsername: insta.instagramUsername,
                                    confirmation: {$ne: 'accept'}
                                }
                            }
                        }).exec();

                        return {
                            instagramUsername: insta.instagramUsername,
                            campaignsCompleted: completed,
                            campaignsDenied: denied
                        };
                    } catch (err) {
                        console.warn(`Error fetching promo data for ${insta.instagramUsername}:`, err);
                        return null; // Возвращаем null в случае ошибки
                    }
                });
            });

            const latestInvoices = await Promise.all(invoicePromises);
            const promoData = await Promise.all(promoPromises);

            // Фильтруем null значения
            const invoiceMap = latestInvoices.reduce((acc, invoice) => {
                if (invoice) {
                    acc[invoice.influencerId] = invoice;
                }
                return acc;
            }, {});

            const promoMap = promoData.reduce((acc, promo) => {
                if (promo) {
                    acc[promo.instagramUsername] = {
                        campaignsCompleted: promo.campaignsCompleted,
                        campaignsDenied: promo.campaignsDenied
                    };
                }
                return acc;
            }, {});

            influencers.forEach((influencer) => {
                try {
                    influencer.instagram.forEach((insta) => {
                        instagrams.push({
                            instagram: insta,
                            influencerId: influencer._id,
                            firstName: influencer.firstName,
                            phone: influencer.phone,
                            balance: influencer.balance,
                            email: influencer.email,
                            avatar: influencerAvatars[influencer._id][insta.instagramUsername],
                            internalNote: influencer.internalNote,
                            latestInvoice: invoiceMap[influencer._id] || "No Invoice",
                            campaignsCompleted: promoMap[insta.instagramUsername]?.campaignsCompleted || 0,
                            campaignsDenied: promoMap[insta.instagramUsername]?.campaignsDenied || 0,
                        });
                    });
                } catch (err) {
                    console.warn(`Skipping influencer ${influencer._id} during final processing:`, err);
                }
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
                    categories: instagram.categories
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
                let totalRefusedPrice = 0;

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

                                if (promoInfluencer.confirmation === 'refusing') {
                                    let influencerPrice: string | number = insta.price;

                                    if (typeof influencerPrice === 'string') {
                                        influencerPrice = parseFloat(influencerPrice.replace(/[^\d.-]/g, ''));
                                    }

                                    totalRefusedPrice += influencerPrice * 2;
                                }

                            }
                        }
                    });
                }

                return {
                    ...promo,
                    totalFollowers,
                    partialRefund: totalRefusedPrice > 0 ? totalRefusedPrice : 0,
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

    async adminUpdatePromoVideo(data: AdminUpdatePromoVideoDto) {
        try {
            const promo = await this.promosModel.findOne({_id: data._id});
            if (!promo) {
                return {
                    status: 404,
                    message: 'Promo not found',
                };
            }

            if (data.newVideoLink) {
                const influencer = promo.selectInfluencers.find((influencer) => influencer.selectedVideo === data.oldVideoLink);

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

            const video = promo.videos.find((video) => video._id === data.videoId);

            if (video) {
                if (data.newVideoLink) {
                    video.videoLink = data.newVideoLink;
                }
                video.postDescription = data.postDescription;
                video.storyTag = data.storyTag;
                video.swipeUpLink = data.swipeUpLink;
                video.specialWishes = data.specialWishes;
            }

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
            const promo = await this.promosModel.findOne({ _id: data.promoId });

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
            const promo = await this.promosModel.findOne({ _id: promoId });

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
            const promo = await this.promosModel.findOne({ _id: data._id });

            if (!promo) {
                return {
                    status: 404,
                    message: 'Promo not found',
                };
            }

            const influencer = await this.influencerModel.findOne({ _id: data.influencerId });
            
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
            const promo = await this.promosModel.findOne({ _id: promoId });

            if (!promo) {
                return {
                    status: 404,
                    message: 'Promo not found',
                };
            }

            const influencer = await this.influencerModel.findOne({ 'instagram.instagramUsername': instagramUsername });
            const instaFollowers = influencer.instagram.find((insta) => insta.instagramUsername === instagramUsername).followersNumber;
            
            if (!influencer) {
                return {
                    status: 404,
                    message: 'Influencer not found',
                };
            }

            const existingInfluencer = promo.selectInfluencers.find(
                (influencer) => influencer.instagramUsername === instagramUsername
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
                instagramUsername: instagramUsername,
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
}