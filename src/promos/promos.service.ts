import {Injectable} from "@nestjs/common";
import {CreatePromosDto} from "./dto/create-promo.dto";
import {CreatePromosEstimateDto} from "./dto/create-promo-estimate.dto";
import {InjectModel} from "@nestjs/mongoose";
import {Promos} from "./schemas/promo.schema";
import mongoose from "mongoose";
import {Client} from "src/auth/schemas/client.schema";
import {Influencer} from "src/auth/schemas/influencer.schema";
import {Offers} from "./schemas/offers.schema";
import sendMail from "src/utils/sendMail";
import {DropboxService} from "src/services/Dropbox.service";

@Injectable()
export class PromosService {
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

    async createPromos(data: CreatePromosDto) {
        try {
            if (!data) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            const result = await this.promosModel.create({
                ...data,
                paymentType: !data.paymentType ? "payment" : data.paymentType,
                paymentStatus: "wait",
                statusPromo: "wait",
            });

            const dataClient = await this.clientModel.findOne({_id: data.userId});
            if (+dataClient.balance <= data.amount) {
                const dataClientBalance = await this.clientModel.findOneAndUpdate(
                    {_id: data.userId},
                    {balance: "0"}
                );
            }
            console.log(data.selectInfluencers);
            const influencerList = await Promise.all(
                data.selectInfluencers.map(async (item) => {
                    const dataInfluencer = await this.influencerModel.findOne({
                        _id: item.influencerId,
                    });

                    if (!dataInfluencer) return null;
                    return dataInfluencer;
                })
            );
            const influencerFilter = influencerList.filter((item) => item);

            await sendMail(
                "admin@soundinfluencers.com",
                "soundinfluencers",
                `<p>Hi</p>
        
        <p>The Client ${
                    dataClient.firstName
                } has requested the following post for this list of influencers</p>
        <p>Post Details:</p><br/><br/>
        <p>Id Promo: ${result._id}</p><br/><br/>
          <p>Video Link: ${data.videoLink}</p>
          <p>Post Description: ${data.postDescription}</p>
          <p>Story Tag: ${data.storyTag}</p>
          <p>Swipe Up Link: ${data.swipeUpLink}</p>
          <p>Date Request: ${data.dateRequest}</p>
          <p>Special Wishes: ${data.specialWishes}</p><br/><br/>

          <p>Influencers Chosen:</p><br/>
          ${data.selectInfluencers.map(
                    (item, index) => `<p>Instagram name: ${item.instagramUsername}</p>`
                )}<br/>

          Payment Method Used: ${result.paymentType}

          <a style="font-weight: 600" href="${
                    process.env.SERVER
                }/promos/verify-promo?promoId=${
                    result._id
                }&status=accept">Approve</a> <a style="font-weight: 600" href="${
                    process.env.SERVER
                }/promos/verify-promo?promoId=${result._id}&status=cancel">Decline</a>

          `,
                "html"
            );

            return {
                code: 201,
                result,
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async createPromosForEstimate(data: CreatePromosEstimateDto) {
        try {
            if (!data) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            const result = await this.promosModel.create({
                ...data,
                paymentType: !data.paymentType ? "payment" : data.paymentType,
                paymentStatus: "wait",
                statusPromo: "estimate",
            });

            const dataClient = await this.clientModel.findOne({ _id: data.userId });

            console.log(data.selectInfluencers);
            const influencerList = await Promise.all(
                data.selectInfluencers.map(async (item) => {
                    const dataInfluencer = await this.influencerModel.findOne({
                        _id: item.influencerId,
                    });

                    if (!dataInfluencer) return null;
                    return dataInfluencer;
                })
            );
            const influencerFilter = influencerList.filter((item) => item);

            await sendMail(
                "admin@soundinfluencers.com",
                "soundinfluencers",
                `<p>Hi</p>
      
      <p>The Client ${dataClient.firstName} has requested a campaign on this network without providing any content</p>

      <p>Influencers Chosen:</p><br/>
      ${data.selectInfluencers.map(
                    (item, index) => `<p>Instagram name: ${item.instagramUsername}</p>`
                ).join('')}<br/>

      <p>Email: ${dataClient.email}</p>
      <p>Phone Number: ${dataClient.phone}</p>
      `,
                "html"
            );

            return {
                code: 201,
                result,
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async verifyPromo(promoId: string, status: string) {
        if (!promoId || !status) {
            return {
                status: 400,
                message: "Not enough arguments",
            };
        }

        try {
            const checkPromo = await this.promosModel.findOne({_id: promoId});

            if (!checkPromo) {
                return {
                    code: 404,
                    message: "promo not found",
                };
            }

            await this.promosModel.updateOne(
                {_id: promoId},
                {verifyPromo: status}
            );

            // const client = await this.clientModel.findById(checkPromo.userId);

            return {
                code: 200,
                message: "ok",
            };
        } catch (err) {
            return {
                code: 500,
                message: err,
            };
        }
    }

    async getOffers() {
        try {
            const offers = await this.offersModel.find({});

            const offersWithAvatars = await Promise.all(
                offers.map(async (offer: any) => {
                    if (!Array.isArray(offer.connectInfluencer)) {
                        return offer;
                    }

                    const connectInfluencerWithAvatars = await Promise.all(
                        offer.connectInfluencer.map(async (influencer: any) => {
                            if (!influencer.influencerId || !influencer.instagramUsername) {
                                return influencer;
                            }

                            try {
                                const avatar = await this.getInfluencerAvatarById(
                                    influencer.influencerId,
                                    influencer.instagramUsername
                                );

                                return {
                                    ...influencer,
                                    avatar: avatar,
                                };
                            } catch (error) {
                                console.error(`Error fetching avatar for influencer ${influencer.influencerId}:`, error);
                                return influencer;
                            }
                        })
                    );

                    return {
                        ...offer?._doc,
                        connectInfluencer: connectInfluencerWithAvatars,
                    };
                })
            );

            return {
                code: 200,
                offers: offersWithAvatars,
            };
        } catch (err) {
            console.error('Error fetching offers:', err);

            return {
                code: 500,
                message: err,
            };
        }
    }

    async getInfluencerAvatarById(influencerId: string, instagramName: string) {
        const influencer = await this.influencerModel.findById(influencerId);
        const avatar = influencer.instagram.find(
            (item) => item.instagramUsername === instagramName
        ).logo;

        return avatar || null;
    }

    async historyPromosClient(id: string) {
        try {
            if (!id) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            const checkUser = await (async () => {
                return await this.clientModel.findOne({_id: id});
            })();

            if (!checkUser) {
                return {
                    code: 404,
                    message: "User not found",
                };
            }

            const promos = await this.promosModel
                .find({
                    userId: id,
                    statusPromo: "finally",
                })
                .lean();

            const promosName = await Promise.all(
                promos.map(async (item) => {
                    const clientName = await this.clientModel.findById(item.userId);
                    if (!clientName) return {...item, client: "No Date"};
                    return {...item, client: clientName.firstName};
                })
            );

            return {
                code: 200,
                promos: promosName,
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async getOngoingPromosClient(id: string) {
        try {
            if (!id) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            const checkUser = await (async () => {
                return await this.clientModel.findOne({_id: id});
            })();

            if (!checkUser) {
                return {
                    code: 404,
                    message: "User not found",
                };
            }

            const promos = await this.promosModel
                .find({
                    userId: id,
                    statusPromo: {$in: ["work", "wait", "estimate"]},
                })
                .lean();

            const promosName = await Promise.all(
                promos.map(async (item) => {
                    const clientName = await this.clientModel.findById(item.userId);
                    if (!clientName) return {...item, client: "No Date"};
                    return {
                        ...item,
                        client: clientName.firstName,
                        brand: clientName.company,
                    };
                })
            );

            return {
                code: 200,
                promos: promosName,
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async getOngoingPromosClientCurrent(id: string, userId: string) {
        try {
            if (!id) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            const checkUser = await (async () => {
                return await this.clientModel.findOne({_id: userId});
            })();

            if (!checkUser) {
                return {
                    code: 404,
                    message: "User not found",
                };
            }

            const promo = await this.promosModel
                .findOne({
                    _id: id,
                })
                .lean();

            const clientName = await this.clientModel.findById(userId);
            const addInfluencer = await Promise.all(
                promo.selectInfluencers.map(async (item) => {
                    const nameInfluencer = await this.influencerModel.findById(
                        item.influencerId
                    );

                    const searchInstagram = nameInfluencer.instagram.find(
                        (fin) => fin.instagramUsername === item.instagramUsername
                    );

                    console.log(searchInstagram);

                    if (!nameInfluencer)
                        return {...item, firstName: "", followersNumber: null};
                    return {
                        ...item,
                        firstName: nameInfluencer.firstName,
                        followersNumber: searchInstagram.followersNumber,
                    };
                })
            );

            return {
                code: 200,
                promo: {
                    ...promo,
                    selectInfluencers: addInfluencer,
                    brand: !clientName ? "No Date" : clientName.company,
                    client: !clientName ? "No Date" : clientName.firstName,
                    dateRequest: promo.dateRequest,
                },
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async historyPromosInfluencer(id: string) {
        try {
            if (!id) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            const checkUser = await (async () => {
                return await this.influencerModel.findOne({_id: id});
            })();

            if (!checkUser) {
                return {
                    code: 404,
                    message: "User not found",
                };
            }

            const promos = await this.promosModel
                .find({
                    selectInfluencers: {
                        $elemMatch: {influencerId: id, closePromo: "close"},
                    },
                })
                .lean();
            const promosName = await Promise.all(
                promos.map(async (item) => {
                    const clientName = await this.clientModel.findById(item.userId);
                    if (!clientName) return {...item, client: "No Date"};
                    return {...item, client: clientName.company};
                })
            );

            return {
                code: 200,
                promos: promosName,
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async historyPromosOne(userId: string, promosId: string) {
        try {
            if (!userId || !promosId) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            const checkUser = await (async () => {
                const client = await this.clientModel.findOne({_id: userId});
                const influencer = await this.influencerModel.findOne({_id: userId});
                if (client) {
                    return client;
                }
                if (influencer) {
                    return influencer;
                }
            })();

            if (!checkUser) {
                return {
                    code: 404,
                    message: "User not found",
                };
            }

            const result = await this.promosModel.findOne({_id: promosId}).lean();

            const clientName = await this.clientModel
                .findOne({_id: result.userId})
                .lean();

            if (!result) {
                return {
                    code: 404,
                    message: "not found",
                };
            }

            return {
                code: 200,
                promo: {
                    ...result,
                    firstName: clientName ? clientName.firstName : "",
                    client: clientName ? clientName.company : "",
                    logo: clientName.logo,
                },
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async getNewPromos(influencerId: string) {
        try {
            if (!influencerId) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            const checkUser = await (async () => {
                const influencer = await this.influencerModel.findOne({
                    _id: influencerId,
                });

                if (influencer) {
                    return influencer;
                }
            })();

            if (!checkUser) {
                return {
                    code: 404,
                    message: "User not found",
                };
            }

            const promos = await this.promosModel
                .find({
                    selectInfluencers: {
                        $elemMatch: {influencerId: influencerId, confirmation: "wait"},
                    },
                    verifyPromo: "accept",
                })
                .lean();

            const allInstagrams = promos.map((item) => {
                return item.selectInfluencers.map((inst) => {
                    const {selectInfluencers, ...newObject} = item;

                    const {_id, ...newObjectInstagram} = inst;

                    return {
                        ...newObject,
                        ...newObjectInstagram,
                        userId: item.userId,
                    };
                });
            });

            const filterInstagram = allInstagrams.flat().filter((item) => {
                if (
                    item.influencerId === influencerId &&
                    item.confirmation === "wait"
                ) {
                    return true;
                }
            });

            const promosName = await Promise.all(
                filterInstagram.map(async (item) => {
                    const client = await this.clientModel.findById(item.userId);
                    const clientName = !client ? "No Date" : client.company;

                    return {
                        ...item,
                        client: clientName,
                        clientLogo: client.logo ? client.logo : "",
                    };
                })
            );

            return {
                code: 200,
                promos: promosName.flat(),
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async updateResponseNewPromo(
        influencerId: string,
        instagramUsername: string,
        promoId: string,
        promoResponse: string
    ) {
        if (!influencerId || !instagramUsername || !promoId || !promoResponse) {
            return {
                status: 400,
                message: "Not enough arguments",
            };
        }

        try {
            const findNewPromo = await this.promosModel.findOne({
                _id: promoId,
                selectInfluencers: {
                    $elemMatch: {
                        influencerId: influencerId,
                        instagramUsername: instagramUsername,
                    },
                },
            });

            if (!findNewPromo) {
                return {
                    code: 404,
                    message: "not found",
                };
            }
            if (findNewPromo.statusPromo === "wait" && promoResponse === "accept") {
                const updateNewPromo = await this.promosModel.findOneAndUpdate(
                    {
                        _id: promoId,
                        selectInfluencers: {
                            $elemMatch: {
                                influencerId: influencerId,
                                instagramUsername: instagramUsername,
                            },
                        },
                    },
                    {
                        $set: {
                            statusPromo: "work",
                            "selectInfluencers.$.confirmation": promoResponse,
                        },
                    }
                );

                const checkUserInfluencer = await this.influencerModel.findOne({
                    _id: influencerId,
                });
                const checkUserClient = await this.clientModel.findOne({
                    _id: findNewPromo.userId,
                });

                await sendMail(
                    "admin@soundinfluencers.com",
                    "soundinfluencers",
                    `<p>${checkUserInfluencer.email} accept the offer for ${checkUserClient.email} campaign</p>
            <p>Details:</p><br/><p>Id Promo: ${findNewPromo._id}</p><p>Client Name: ${checkUserClient.firstName}</p><p>Video Link: ${findNewPromo.videoLink}</p>`,
                    "html"
                );

                return {
                    code: 200,
                    updateNewPromo,
                };
            } else {
                const updateNewPromo = await this.promosModel.findOneAndUpdate(
                    {
                        _id: promoId,
                        selectInfluencers: {
                            $elemMatch: {
                                influencerId: influencerId,
                                instagramUsername: instagramUsername,
                            },
                        },
                    },
                    {
                        $set: {
                            "selectInfluencers.$.confirmation": promoResponse,
                        },
                    }
                );

                const checkUserInfluencer = await this.influencerModel.findOne({
                    _id: influencerId,
                });
                const checkUserClient = await this.clientModel.findOne({
                    _id: findNewPromo.userId,
                });

                await sendMail(
                    "admin@soundinfluencers.com",
                    "soundinfluencers",
                    `<p>${checkUserInfluencer.email} declines the offer for ${checkUserClient.email} campaign</p>
            <p>Details:</p><br/><p>Id Promo: ${findNewPromo._id}</p><p>Client Name: ${checkUserClient.firstName}</p><p>Video Link: ${findNewPromo.videoLink}</p>`,
                    "html"
                );

                return {
                    code: 200,
                    updateNewPromo,
                };
            }
        } catch (err) {
            return {
                code: 500,
                message: err,
            };
        }
    }

    async getOngoingPromos(influencerId: string) {
        try {
            if (!influencerId) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            const checkUser = await this.influencerModel.findOne({
                _id: influencerId,
            });

            if (!checkUser) {
                return {
                    code: 404,
                    message: "User not found",
                };
            }

            const promos = await this.promosModel
                .find({
                    selectInfluencers: {
                        $elemMatch: {
                            influencerId: influencerId,
                            confirmation: "accept",
                            closePromo: "wait",
                        },
                    },
                    statusPromo: "work",
                })
                .lean();

            const allInstagrams = promos.map((item) => {
                return item.selectInfluencers.map((inst) => {
                    const {selectInfluencers, ...newObject} = item;

                    const {_id, ...newObjectInstagram} = inst;

                    return {
                        ...newObject,
                        ...newObjectInstagram,
                        userId: item.userId,
                        promoId: item._id,
                    };
                });
            });

            const filterInstagram = allInstagrams.flat().filter((item) => {
                if (
                    item.influencerId === influencerId &&
                    item.confirmation === "accept" &&
                    item.closePromo === "wait"
                ) {
                    return true;
                }
            });

            const promosName = await Promise.all(
                filterInstagram.map(async (item) => {
                    const client = await this.clientModel.findById(item.userId);
                    const clientName = !client ? "No Date" : client.company;

                    return {
                        ...item,
                        client: clientName,
                        clientLogo: client.logo ? client.logo : "",
                        date: item.createdAt,
                    };
                })
            );

            return {
                code: 200,
                promos: promosName,
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async getOngoingPromoOne(
        influencerId: string,
        promoId: string,
        instagramUsername: string
    ) {
        try {
            if (!influencerId || !promoId || !instagramUsername) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            const checkUser = await (async () => {
                const influencer = await this.influencerModel.findOne({
                    _id: influencerId,
                });

                if (influencer) {
                    return influencer;
                }
            })();

            if (!checkUser) {
                return {
                    code: 404,
                    message: "User not found",
                };
            }

            const promo = await this.promosModel
                .findOne({
                    _id: promoId,
                    selectInfluencers: {
                        $elemMatch: {
                            influencerId: influencerId,
                            confirmation: "accept",
                            instagramUsername: instagramUsername,
                        },
                    },
                })
                .lean();

            if (!promo) {
                return {
                    code: 404,
                    message: "not found",
                };
            }

            const currentDataInfluencer = promo.selectInfluencers.find(
                (item) =>
                    item.influencerId === influencerId &&
                    item.instagramUsername === instagramUsername
            );

            if (!currentDataInfluencer) {
                return {
                    code: 404,
                    message: "not found",
                };
            }

            const promoCurrent = await this.promosModel.findOne({_id: promoId});

            const client = await this.clientModel.findOne({_id: promo.userId});

            return {
                code: 200,
                promo: {
                    ...currentDataInfluencer,
                    ...promo,
                    client: client.company,
                    logo: client.logo,
                },
                description: promoCurrent.postDescription,
                dateRequest: promoCurrent.dateRequest,
                date: promoCurrent.createdAt,
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async updateOngoingPromo(
        influencerId: string,
        instagramUsername: string,
        promoId: string,
        data: any
    ) {
        if (!influencerId || !promoId || !instagramUsername) {
            return {
                status: 400,
                message: "Not enough arguments",
            };
        }

        try {
            const findNewPromo = await this.promosModel
                .findOne({
                    _id: promoId,
                    selectInfluencers: {
                        $elemMatch: {
                            influencerId: influencerId,
                            instagramUsername: instagramUsername,
                        },
                    },
                })
                .lean()
                .exec();

            if (!findNewPromo) {
                return {
                    code: 404,
                    message: "not found",
                };
            }

            const dataInstagram = findNewPromo.selectInfluencers.find(
                (item) =>
                    item.instagramUsername === instagramUsername &&
                    item.influencerId === influencerId
            );

            const updateNewPromo = await (async () => {
                if (
                    data.postLink &&
                    data.datePost &&
                    data.impressions &&
                    data.like &&
                    data.screenshot
                ) {
                    const paymentGo = async () => {
                        const checkInfluencer =
                            await this.influencerModel.findById(influencerId);

                        const currentInstagram = checkInfluencer.instagram.find(
                            (fin) => fin.instagramUsername === instagramUsername
                        );

                        await this.influencerModel.findOneAndUpdate(
                            {_id: influencerId},
                            {
                                balance: String(
                                    Number(checkInfluencer.balance) +
                                    (+currentInstagram.price.replace(/[^\d]/g, "") / 2)
                                ),
                            }
                        );
                    };

                    if (dataInstagram.closePromo !== "close") await paymentGo();

                    return await this.promosModel.findOneAndUpdate(
                        {
                            _id: promoId,
                            selectInfluencers: {
                                $elemMatch: {
                                    influencerId: influencerId,
                                    instagramUsername: instagramUsername,
                                },
                            },
                        },
                        {
                            $set: {
                                "selectInfluencers.$": {
                                    ...dataInstagram,
                                    ...data,
                                    closePromo: "close",
                                },
                            },
                        }
                    );
                } else {
                    return await this.promosModel.findOneAndUpdate(
                        {
                            _id: promoId,
                            selectInfluencers: {
                                $elemMatch: {
                                    influencerId: influencerId,
                                    instagramUsername: instagramUsername,
                                },
                            },
                        },
                        {
                            $set: {
                                "selectInfluencers.$": {
                                    ...dataInstagram,
                                    ...data,
                                },
                            },
                        }
                    );
                }
            })();

            let checkPromo = true;
            findNewPromo.selectInfluencers.forEach((item) => {
                if (item.confirmation === "refusing") return;
                if (item.instagramUsername === instagramUsername) {
                    if (
                        data.postLink &&
                        data.datePost &&
                        data.impressions &&
                        data.like &&
                        data.screenshot
                    ) {
                        return;
                    }
                }
                if (
                    item.postLink &&
                    item.datePost &&
                    item.impressions &&
                    item.like &&
                    item.screenshot
                ) {
                } else {
                    checkPromo = false;
                }
            });

            if (checkPromo) {
                await this.promosModel.findOneAndUpdate(
                    {_id: promoId},
                    {statusPromo: "finally"}
                );

                await Promise.all(
                    findNewPromo.selectInfluencers.map(async (item) => {
                        const checkInfluencer = await this.influencerModel.findById(
                            item.influencerId
                        );
                        const currentInstagram = checkInfluencer.instagram.find(
                            (fin) => fin.instagramUsername === item.instagramUsername
                        );

                        console.log(
                            checkInfluencer.balance,
                            currentInstagram.price.replace(/[^\d]/g, "")
                        );

                        await this.influencerModel.findOneAndUpdate(
                            {_id: item.influencerId},
                            {
                                balance: String(
                                    Number(checkInfluencer.balance) +
                                    (+currentInstagram.price.replace(/[^\d]/g, "") / 2)
                                ),
                            }
                        );
                    })
                );
            }

            return {
                code: 200,
                updateNewPromo,
            };
        } catch (err) {
            return {
                code: 500,
                message: err,
            };
        }
    }

    async uploadDropBox(file: any) {
        const dropboxService = new DropboxService();
        const screenshotUrl = await dropboxService.uploadFile(
            file.buffer,
            file.originalname
        );
        return {
            code: 200,
            data: screenshotUrl,
        };
    }
}
