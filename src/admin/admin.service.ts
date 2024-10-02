import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Promos} from "../promos/schemas/promo.schema";
import mongoose from "mongoose";
import {Client} from "../auth/schemas/client.schema";
import {Influencer} from "../auth/schemas/influencer.schema";
import {Offers} from "../promos/schemas/offers.schema";
import {AdminUpdatePersonalClientDto} from "./dto/admin-update-client.dto";
import {AdminUpdateInfluencerPersonalDto} from "./dto/admin-update-influencer-personal.dto";
import {AdminUpdateInfluencerInstagramDto} from "./dto/admin-update-influencer-instagram.dto";
import {Invoices} from "../invoice/schemas/invoices.schema";


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
        private invoicesModel: mongoose.Model<Invoices>
    ) {
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
            const influencers = await this.influencerModel.find({statusVerify: 'accept'}).lean().exec();

            if (!influencers || influencers.length === 0) {
                return {
                    status: 404,
                    message: 'No influencers found',
                };
            }

            const instagrams = [];
            const influencerAvatars = {};

            influencers.forEach((influencer) => {
                influencer.instagram.forEach((insta) => {
                    influencerAvatars[influencer._id] = influencerAvatars[influencer._id] || {};
                    influencerAvatars[influencer._id][insta.instagramUsername] = insta.logo;
                });
            });

            const invoicePromises = influencers.map(influencer =>
                this.invoicesModel.findOne({ influencerId: influencer._id })
                    .sort({ createdAt: -1 }) 
                    .lean() 
                    .exec()
            );

            const promoPromises = influencers.flatMap(influencer =>
                influencer.instagram.map(insta => {
                    return Promise.all([
                        this.promosModel.countDocuments({
                            selectInfluencers: {
                                $elemMatch: {
                                    instagramUsername: insta.instagramUsername,
                                    confirmation: 'accept',
                                    closePromo: 'close'
                                }
                            }
                        }).exec(),
                        this.promosModel.countDocuments({
                            selectInfluencers: {
                                $elemMatch: {
                                    instagramUsername: insta.instagramUsername,
                                    confirmation: {$ne: 'accept'}
                                }
                            }
                        }).exec()
                    ]).then(([campaignsCompleted, campaignsDenied]) => ({
                        instagramUsername: insta.instagramUsername,
                        campaignsCompleted,
                        campaignsDenied
                    }));
                })
            );

            const [latestInvoices, promoData] = await Promise.all([Promise.all(invoicePromises), Promise.all(promoPromises)]);

            const invoiceMap = latestInvoices.reduce((acc, invoice) => {
                if (invoice) {
                    acc[invoice.influencerId] = invoice; // Используем createdAt для получения даты
                }
                return acc;
            }, {});

            const promoMap = promoData.reduce((acc, promo) => {
                acc[promo.instagramUsername] = {
                    campaignsCompleted: promo.campaignsCompleted,
                    campaignsDenied: promo.campaignsDenied
                };
                return acc;
            }, {});

            influencers.forEach((influencer) => {
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
                        'instagram.$.price': data.price
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
            const influencer = await this.influencerModel.findOne({ _id: influencerId }).lean().exec();

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
}