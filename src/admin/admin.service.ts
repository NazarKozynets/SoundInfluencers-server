import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Promos} from "../promos/schemas/promo.schema";
import mongoose from "mongoose";
import {Client} from "../auth/schemas/client.schema";
import {Influencer} from "../auth/schemas/influencer.schema";
import {Offers} from "../promos/schemas/offers.schema";
import {AdminUpdatePersonalClientDto} from "./dto/admin-update-client.dto";


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
        private offersModel: mongoose.Model<Offers>
    ) {
    }

    async adminGetClients() {
        try {
            const getClientsAll = await this.clientModel
                .find({ statusVerify: 'accept' })
                .select(['-password'])
                .lean()
                .exec();

            // Инициализируем массив для клиентов
            const clients = [];

            // Проходим по каждому клиенту
            for (const client of getClientsAll) {
                // Считаем количество завершённых кампаний
                const campaignsCompleted = await this.promosModel.countDocuments({
                    userId: client._id,
                    statusPromo: 'finally'
                }).exec();

                // Считаем количество отклонённых кампаний
                const campaignsDenied = await this.promosModel.countDocuments({
                    userId: client._id,
                    selectInfluencers: {
                        $elemMatch: {
                            confirmation: { $ne: 'accept' }
                        }
                    }
                }).exec();

                // Считаем количество текущих кампаний
                const campaignsOngoing = await this.promosModel.countDocuments({
                    userId: client._id,
                    statusPromo: 'work'
                }).exec();

                // Получаем последнюю кампанию
                const latestCampaign = await this.promosModel.find({
                    userId: client._id
                }).sort({ createdAt: -1 }).limit(1).lean().exec();

                // Добавляем данные клиента и количество кампаний в массив
                clients.push({
                    ...client,
                    campaignsCompleted,
                    campaignsDenied,
                    campaignsOngoing,
                    latestCampaign: latestCampaign[0], // Оставляем самую последнюю кампанию, если она есть
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
            const influencers = await this.influencerModel.find({statusVerify: 'accept'}).lean()
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
                influencer.instagram.forEach((insta) => {
                    influencerAvatars[influencer._id] = influencerAvatars[influencer._id] || {};
                    influencerAvatars[influencer._id][insta.instagramUsername] = insta.logo;
                });
            });

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

}