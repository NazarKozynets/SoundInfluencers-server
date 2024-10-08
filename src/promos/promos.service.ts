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
import * as process from "node:process";

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

            const processedInfluencers = data.selectInfluencers.map((influencer) => {
                const selectedVideo = influencer.selectedVideo;
                const dateRequest = influencer.dateRequest;

                return {
                    ...influencer,
                    selectedVideo,
                    dateRequest,
                };
            });

            const result = await this.promosModel.create({
                ...data,
                selectInfluencers: processedInfluencers,
                paymentType: !data.paymentType ? "payment" : data.paymentType,
                paymentStatus: "wait",
                statusPromo: "wait",
                verifyPromo: "wait",
            });

            const dataClient = await this.clientModel.findOne({ _id: data.userId });
            if (+dataClient.balance <= data.amount) {
                await this.clientModel.findOneAndUpdate(
                    { _id: data.userId },
                    { balance: "0" }
                );
            }

            const emailContent = `
<p>Hi,</p>
<p>The Client ${dataClient.firstName} has requested the following post for this list of influencers:</p>
<p><strong>Post Details:</strong></p>
<p><strong>Campaign Name: ${data.campaignName}</strong></p>
${data.videos.map((video, index) => `
    <p><strong>Video ${index + 1}:</strong></p>
    <ul>
        <li><strong>Link:</strong> ${video.videoLink}</li>
        <li><strong>Post Description:</strong> ${video.postDescription}</li>
        <li><strong>Story Tag:</strong> ${video.storyTag}</li>
        <li><strong>Swipe Up Link:</strong> ${video.swipeUpLink}</li>
        <li><strong>Special Wishes:</strong> ${video.specialWishes}</li>
    </ul>
    <p><strong>Selected Influencers:</strong></p>
    <ul>
        ${data.selectInfluencers
                .filter(influencer => influencer.selectedVideo === video.videoLink)
                .map(influencer => `<li>Instagram name: ${influencer.instagramUsername}</li>`)
                .join('')}
    </ul>
`).join('')}
<p>Payment Method Used: ${result.paymentType}</p>
<p>
    <a style="font-weight: 600" href="${process.env.SERVER}/promos/verify-promo?promoId=${result._id}&status=accept">
        Approve
    </a> 
    <a style="font-weight: 600" href="${process.env.SERVER}/promos/verify-promo?promoId=${result._id}&status=cancel">
        Decline
    </a>
</p>`;

            await sendMail(
                // "nazarkozynets030606@zohomail.eu",
                "admin@soundinfluencers.com",
                "soundinfluencers",
                emailContent,
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
    
    async createPromosForEstimate(data: CreatePromosEstimateDto, isPO: boolean = false) {
        try {
            if (!data) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            if (!isPO) {
                const result = await this.promosModel.create({
                    ...data,
                    paymentType: !data.paymentType ? "payment" : data.paymentType,
                    paymentStatus: "wait",
                    statusPromo: "estimate",
                    isPO: false,
                });

                const dataClient = await this.clientModel.findOne({_id: data.userId});

                const influencerList = await Promise.all(
                    data.selectInfluencers.map(async (item) => {
                        const dataInfluencer = await this.influencerModel.findOne({
                            _id: item.influencerId,
                        });
                        return dataInfluencer ? dataInfluencer : null;
                    })
                );
                const influencerFilter = influencerList.filter((item) => item);

                await sendMail(
                    // "nazarkozynets030606@zohomail.eu",
                    "admin@soundinfluencers.com",
                    "soundinfluencers",
                    `<p>Hi</p>
                <p>The Client ${dataClient.firstName} has requested a campaign on this network without providing any content</p>
                <p>Influencers Chosen:</p><br/>
                ${data.selectInfluencers
                        .map((item) => `<p>Instagram name: ${item.instagramUsername}</p>`)
                        .join('')}<br/>
                <p>Email: ${dataClient.email}</p>
                <p>Phone Number: ${dataClient.phone}</p>
                `,
                    "html"
                );

                return {
                    code: 201,
                    result,
                };
            } else {
                const processedInfluencers = data.selectInfluencers.map((influencer) => {
                    const selectedVideo = influencer.selectedVideo;
                    const dateRequest = influencer.dateRequest;

                    return {
                        ...influencer,
                        selectedVideo,
                        dateRequest,
                    };
                });

                const result = await this.promosModel.create({
                    ...data,
                    selectInfluencers: processedInfluencers,
                    paymentType: !data.paymentType ? "payment" : data.paymentType,
                    paymentStatus: "wait",
                    statusPromo: "estimate",
                    isPO: true,
                });

                const dataClient = await this.clientModel.findOne({_id: data.userId});
                if (+dataClient.balance <= data.amount) {
                    await this.clientModel.findOneAndUpdate(
                        {_id: data.userId},
                        {balance: "0"}
                    );
                }

                const influencerList = await Promise.all(
                    data.selectInfluencers.map(async (item) => {
                        const dataInfluencer = await this.influencerModel.findOne({
                            _id: item.influencerId,
                        });
                        return dataInfluencer ? dataInfluencer : null;
                    })
                );
                const influencerFilter = influencerList.filter((item) => item);

                await sendMail(
                    // "nazarkozynets030606@zohomail.eu",
                    "admin@soundinfluencers.com",
                    "soundinfluencers",
                    `<p>Hi,</p>
<p>The Client ${dataClient.firstName} has requested the following post for this list of influencers:</p>
<p><strong>Post Details:</strong></p>
${data.videos.map((video, index) => `
    <p><strong>Video ${index + 1}:</strong></p>
    <ul>
        <li><strong>Link:</strong> ${video.videoLink}</li>
        <li><strong>Post Description:</strong> ${video.postDescription}</li>
        <li><strong>Story Tag:</strong> ${video.storyTag}</li>
        <li><strong>Swipe Up Link:</strong> ${video.swipeUpLink}</li>
        <li><strong>Special Wishes:</strong> ${video.specialWishes}</li>
    </ul>
`).join('')}
<p><strong>Selected Influencers:</strong></p>
<ul>
    ${data.selectInfluencers.map(
                        (item) => `<li>Instagram name: ${item.instagramUsername}</li>`
                    ).join('')}
</ul>
<p>Payment Method Used: ${result.paymentType}</p>`,
                    "html"
                );

                return {
                    code: 201,
                    result,
                };
            }
        } catch (err) {
            return {
                code: 500,
                message: err.message,
            };
        }
    }

    async updateEstimatePromo(promoId: string, isPoNeed: string) {
        try {
            const findPromo = await this.promosModel.findOne({ _id: promoId }).lean().exec();

            if (!findPromo) {
                return { status: 404, message: 'Promo not found' };
            }

            let updateFields: any = { statusPromo: findPromo.statusPromo, verifyPromo: findPromo.verifyPromo };

            const isPoNeedBool = isPoNeed === 'true';

            const paymentType = findPromo.paymentType.trim().toLowerCase();
            const statusPromo = findPromo.statusPromo.trim().toLowerCase();

            if (isPoNeedBool === true && paymentType === 'po request') {
                if (statusPromo === 'po waiting') {
                    updateFields.statusPromo = 'wait';
                    updateFields.verifyPromo = 'accept';
                }
            } else if (isPoNeedBool === false && paymentType === 'po request') {
                if (statusPromo === 'estimate') {
                    updateFields.statusPromo = 'po waiting';
                }
            } else if (statusPromo === 'estimate' && paymentType !== 'po request') {
                updateFields.statusPromo = 'wait';
                updateFields.verifyPromo = 'accept';
            }

            if (updateFields.statusPromo !== findPromo.statusPromo || updateFields.verifyPromo !== findPromo.verifyPromo) {
                await this.promosModel.findOneAndUpdate(
                    { _id: promoId },
                    updateFields
                );
            } 

            return { status: 200, message: 'estimate Promo status updated successfully' };
        } catch (err) {
            console.error('Error updating promo status:', err);
            return { status: 500, message: err.message };
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

            if (status === "accept") {
                const checkPromo = await this.promosModel.findById(promoId);
                const influencersIds = checkPromo.selectInfluencers.map((item) => item.influencerId);

                const influencers = await this.influencerModel.find({_id: {$in: influencersIds}});

                for (let influencer of influencers) {
                    const influencerInstagramAccounts = influencer.instagram.map((account) => account.instagramUsername); 

                    const influencerVideos = checkPromo.videos.filter((video) => {
                        return checkPromo.selectInfluencers.some((influencerData) => {
                            return influencerData.selectedVideo === video.videoLink && influencerInstagramAccounts.includes(influencerData.instagramUsername);
                        });
                    });

                    if (influencerVideos.length > 0) {
                        const accountNames = influencer.instagram
                            .filter(account => influencerVideos.some(video => {
                                return checkPromo.selectInfluencers.some(influencerData => influencerData.selectedVideo === video.videoLink && influencerData.instagramUsername === account.instagramUsername);
                            }))
                            .map(account => account.instagramUsername)
                            .join(', '); 

                        const emailToInfluencer = `
<p>Hi,</p>
<p>You have received a new promo request on your account for the following:</p>
<p><strong>${accountNames} - Instagram Post & Story</strong></p>
<p><strong>Post Details:</strong></p>
${influencerVideos.map((video, index) => `
    <p><strong>Video ${index + 1}:</strong></p>
    <ul>
        <li><strong>Link:</strong> ${video.videoLink || 'No link provided'}</li>
        <li><strong>Post Description:</strong> ${video.postDescription || 'No description provided'}</li>
        <li><strong>Story Tag:</strong> ${video.storyTag || 'No story tag provided'}</li>
        <li><strong>Swipe Up Link:</strong> ${video.swipeUpLink || 'No post link provided'}</li>
        <li><strong>Special Wishes:</strong> ${video.specialWishes || 'None'}</li>
    </ul>
`).join('')}      
<p>Access your account to accept or deny it here: https://go.soundinfluencers.com/account/influencer/new-promos</p>     
<p>Thanks,</p>
<p>Soundinfluencers Team</p>
`;

                        await sendMail(influencer.email, "soundinfluencers", emailToInfluencer, "html");
                    }
                }

                return {
                    code: 200,
                    message: "promo verified",
                };
            }
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

    async checkUploadStatus(fileName: string): Promise<boolean> {
        const dropboxService = new DropboxService();
        return await dropboxService.isFileUploaded(fileName);
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
                    statusPromo: {$in: ["work", "wait", "estimate", "po waiting"]},
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

            const checkUser = await this.clientModel.findById(userId);
            if (!checkUser) {
                return {
                    code: 404,
                    message: "User not found",
                };
            }

            const promo = await this.promosModel
                .findById(id)
                .lean();

            if (!promo) {
                return {
                    code: 404,
                    message: "Promo not found",
                };
            }

            const clientData = await this.clientModel.findById(userId);

            const selectInfluencersWithDetails = await Promise.all(
                promo.selectInfluencers.map(async (influencerItem) => {
                    const influencerData = await this.influencerModel.findById(influencerItem.influencerId);

                    if (!influencerData) {
                        return {
                            ...influencerItem,
                            firstName: "",
                            followersNumber: null,
                        };
                    }

                    const instagramAccount = influencerData.instagram.find(
                        (insta) => insta.instagramUsername === influencerItem.instagramUsername
                    );

                    return {
                        ...influencerItem,
                        firstName: influencerData.firstName,
                        followersNumber: instagramAccount ? instagramAccount.followersNumber : null,
                    };
                })
            );

            return {
                code: 200,
                promo: {
                    ...promo,
                    selectInfluencers: selectInfluencersWithDetails,
                    brand: clientData ? clientData.company : "No Data",
                    client: clientData ? clientData.firstName : "No Data",
                    dateRequest: promo.createdAt,
                    videos: promo.videos || [],
                    paymentStatus: promo.paymentStatus,
                    paymentType: promo.paymentType,
                    amount: promo.amount,
                    campaignName: promo.campaignName,
                },
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err.message || "Internal Server Error",
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
                    message: "Promo not found",
                };
            }

            if ((findNewPromo.statusPromo === "wait" || findNewPromo.statusPromo === 'work') && promoResponse === "accept") {
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
                    },
                    {new: true}
                );

                const checkUserInfluencer = await this.influencerModel.findById(influencerId);
                const checkUserClient = await this.clientModel.findById(findNewPromo.userId);

                await sendMail(
                    // "nazarkozynets030606@zohomail.eu",
                    "admin@soundinfluencers.com",
                    "soundinfluencers",
                    `<p>${checkUserInfluencer.email} accepted the offer for ${checkUserClient.email}'s campaign</p>
                <p>Details:</p><br/>
                <p>Promo ID: ${findNewPromo._id}</p>
                <p>Client Name: ${checkUserClient.firstName}</p>
                <p>Videos: ${findNewPromo.videos
                        .map((video) => `<a href="${video.videoLink}">${video.videoLink}</a>`)
                        .join(", ")}</p>`,
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
                    },
                    {new: true}
                );

                const checkUserInfluencer = await this.influencerModel.findById(influencerId);
                const checkUserClient = await this.clientModel.findById(findNewPromo.userId);

                await sendMail(
                    // "nazarkozynets030606@zohomail.eu",
                    "admin@soundinfluencers.com",
                    "soundinfluencers",
                    `<p>${checkUserInfluencer.email} declined the offer for ${checkUserClient.email}'s campaign</p>
                <p>Details:</p><br/>
                <p>Promo ID: ${findNewPromo._id}</p>
                <p>Client Name: ${checkUserClient.firstName}</p>
                <p>Videos: ${findNewPromo.videos
                        .map((video) => `<a href="${video.videoLink}">${video.videoLink}</a>`)
                        .join(", ")}</p>`,
                    "html"
                );

                return {
                    code: 200,
                    updateNewPromo,
                };
            }
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err.message || "Internal Server Error",
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

            const influencer = await this.influencerModel.findById(influencerId);
            if (!influencer) {
                return {
                    code: 404,
                    message: "Influencer not found",
                };
            }

            const promo = await this.promosModel.findOne({
                _id: promoId,
                selectInfluencers: {
                    $elemMatch: {
                        influencerId: influencerId,
                        confirmation: "accept",
                        instagramUsername: instagramUsername,
                    },
                },
            }).lean();

            if (!promo) {
                return {
                    code: 404,
                    message: "Promo not found",
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
                    message: "Influencer not found in promo",
                };
            }

            const promoCurrent = await this.promosModel.findById(promoId);

            const client = await this.clientModel.findById(promo.userId);
            if (!client) {
                return {
                    code: 404,
                    message: "Client not found",
                };
            }

            return {
                code: 200,
                promo: {
                    ...currentDataInfluencer,
                    ...promo,
                    client: client.company || "No Company",
                    logo: client.logo || null,
                },
                description: promoCurrent.videos?.map(video => video.postDescription) || "No description",
                dateRequest: promoCurrent.createdAt,
                date: promoCurrent.createdAt,
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err.message || "Internal Server Error",
            };
        }
    }

    async updateOngoingPromo(
        influencerId: string,
        instagramUsername: string,
        promoId: string,
        data: any,
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
                                    (+currentInstagram.price.replace(/[^\d]/g, ""))
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

                        await this.influencerModel.findOneAndUpdate(
                            {_id: item.influencerId},
                            {
                                balance: String(
                                    Number(checkInfluencer.balance) +
                                    (+currentInstagram.price.replace(/[^\d]/g, ""))
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
        const screenshotUrl = await dropboxService.uploadFile(file.buffer, file.originalname);
        console.log('yes');
        return {
            code: 200,
            data: screenshotUrl,
        };
    }
    
    async getPromoByPublicShareLink(promoId: string) {
        try {
            if (!promoId) {
                return {
                    status: 400,
                    message: "Not enough arguments",
                };
            }

            const promo = await this.promosModel.findById(promoId);

            if (!promo) {
                return {
                    code: 404,
                    message: "Promo not found",
                };
            }

            return {
                code: 200,
                promo,
            };
        } catch (err) {
            console.error('Error fetching promo by public share link:', err);

            return {
                code: 500,
                message: err,
            };
        }
    }

    // async updateOngoingPromoPostLinkAndDatePost(
    //     influencerId: string,
    //     instagramUsername: string,
    //     promoId: string,
    //     data: any,
    // ) {
    //     if (!influencerId || !promoId || !instagramUsername) {
    //         return {
    //             status: 400,
    //             message: "Not enough arguments",
    //         };
    //     }
    //
    //     try {
    //         const findNewPromo = await this.promosModel
    //             .findOne({
    //                 _id: promoId,
    //                 selectInfluencers: {
    //                     $elemMatch: {
    //                         influencerId: influencerId,
    //                         instagramUsername: instagramUsername,
    //                     },
    //                 },
    //             })
    //             .lean()
    //             .exec();
    //
    //         if (!findNewPromo) {
    //             return {
    //                 code: 404,
    //                 message: "not found",
    //             };
    //         }
    //
    //         const dataInstagram = findNewPromo.selectInfluencers.find(
    //             (item) =>
    //                 item.instagramUsername === instagramUsername &&
    //                 item.influencerId === influencerId
    //         );
    //
    //         const promises = findNewPromo.selectInfluencers.map(async (item) => {
    //             if (item.postLink) {
    //                 try {
    //                     const browser = await puppeteer.launch();
    //                     const page = await browser.newPage();
    //                     await page.goto(item.postLink, { waitUntil: 'load' });
    //
    //                     const content = await page.content();
    //
    //                     const postDescription = await page.evaluate(() => {
    //                         const descriptionMeta = document.querySelector('meta[name="description"]');
    //                         if (descriptionMeta) {
    //                             return descriptionMeta.getAttribute('content');
    //                         }
    //
    //                         const descriptionDiv = document.querySelector('div[role="dialog"] div') ||
    //                             document.querySelector('div[class*="C4VMK"] > span'); 
    //                         return descriptionDiv ? (descriptionDiv as HTMLElement).innerText : "Описание не найдено";
    //                     });
    //
    //                     // Извлечение количества лайков
    //                     const likesMatch = postDescription.match(/(\d+) likes/);
    //                     const likesCount = likesMatch ? parseInt(likesMatch[1], 10) : 0;
    //
    //                     console.log(`Post Link: ${item.postLink}, Likes: ${likesCount}`);
    //                     await browser.close();
    //                 } catch (error) {
    //                     console.error(`Ошибка при получении данных из ${item.postLink}:`, error.message);
    //                 }
    //             }
    //         });
    //
    //         await Promise.all(promises);
    //
    //         const updateNewPromo = await this.promosModel.findOneAndUpdate(
    //             {
    //                 _id: promoId,
    //                 selectInfluencers: {
    //                     $elemMatch: {
    //                         influencerId: influencerId,
    //                         instagramUsername: instagramUsername,
    //                     },
    //                 },
    //             },
    //             {
    //                 $set: {
    //                     "selectInfluencers.$": {
    //                         ...dataInstagram,
    //                         postLink: data.postLink || dataInstagram.postLink,
    //                         datePost: data.datePost || dataInstagram.datePost,
    //                     },
    //                 },
    //             },
    //         );
    //
    //         let checkPromo = findNewPromo.selectInfluencers.every((item) =>
    //             item.postLink && item.datePost
    //         );
    //
    //         if (checkPromo) {
    //             await this.promosModel.findOneAndUpdate(
    //                 { _id: promoId },
    //                 { statusPromo: "finally" }
    //             );
    //         }
    //
    //         return {
    //             code: 200,
    //             updateNewPromo,
    //         };
    //     } catch (err) {
    //         return {
    //             code: 500,
    //             message: err.message || "Internal server error",
    //         };
    //     }
    // }
}
