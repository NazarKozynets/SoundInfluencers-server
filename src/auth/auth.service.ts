import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {CreateClientDto} from './dto/create-client.dto';
import {CreateInfluencerDto} from './dto/create-influencer.dto';
import {Client} from './schemas/client.schema';
import mongoose from 'mongoose';
import { Types } from 'mongoose';
import {Influencer} from './schemas/influencer.schema';
import {LoginClientDto} from './dto/login-client.dto';
import {VerifyDto} from './dto/verify.dto';
import sendMail from "../utils/sendMail";
import {VerifyInfluencer} from './schemas/verifyInfluencer.schema';
import {VerifyClient} from './schemas/verifyClient.schema';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

export function generateRandomString() {
    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < 20; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}

function generateRandomDigits(length) {
    const result = [];
    for (let i = 0; i < length; i++) {
        const randomDigit = Math.floor(Math.random() * 10);
        result.push(randomDigit);
    }
    return result.join('');
}

@Injectable()
export class AuthService {
    private readonly secretKey = '9fgfdrdr@fdfd';

    constructor(
        @InjectModel(Client.name)
        private clientModel: mongoose.Model<Client>,
        @InjectModel(Influencer.name)
        private influencerModel: mongoose.Model<Influencer>,
        @InjectModel(VerifyInfluencer.name)
        private verifyInfluencerModel: mongoose.Model<VerifyInfluencer>,
        @InjectModel(VerifyClient.name)
        private verifyClientModel: mongoose.Model<VerifyClient>,
    ) {
    }

    async createClient(data: CreateClientDto) {
        try {
            if (!data) {
                return {
                    status: 400,
                    message: 'Not enough arguments',
                };
            }

            const checkUser = await (async () => {
                const checkInfluencer = await this.influencerModel.findOne({
                    email: data.email,
                });

                if (checkInfluencer) return checkInfluencer;

                const checkClient = await this.clientModel.findOne({
                    email: data.email,
                });
                if (checkClient) return checkClient;

                return null;
            })();

            if (checkUser) {
                return {
                    code: 409,
                    message: 'This user already exists',
                };
            }

            const checkUserInstagram = await (async () => {
                const checkInfluencer = await this.influencerModel.findOne({
                    instagramUsername: data.instagramUsername,
                });

                if (checkInfluencer) return checkInfluencer;

                const checkClient = await this.clientModel.findOne({
                    instagramUsername: data.instagramUsername,
                });
                if (checkClient) return checkClient;

                return null;
            })();

            if (checkUserInstagram) {
                return {
                    code: 409,
                    message: 'This instagram already exists',
                };
            }

            const newUser = await this.clientModel.create({
                ...data,
                referenceNumber: generateRandomDigits(6),
                password: bcrypt.hashSync(data.password),
                balance: "0"
            });

            const generateVerifyId = generateRandomString();

            await this.verifyClientModel.create({
                clientId: newUser._id,
                verifyId: generateVerifyId,
            });

            await sendMail(
                'admin@soundinfluencers.com',
                'soundinfluencers',
                `<p>Request from a new client ${data.company}</p><b>Details:</b><br/><br/><p>First Name: ${data.firstName}</p>
        <p>Company: ${data.company}</p>
        <p>Company Type: ${data.companyType}</p>
        <p>Instagram: ${data.instagramUsername}</p>
        <p>Email: ${data.email}</p>
        <p>Phone: ${data.phone}</p>
        <p>Referal Code: ${data.referalCode}</p>
        <h2>Do you want to verify your account?</h2>
        <a href="${process.env.SERVER}/auth/verify-client?verifyId=${generateVerifyId}&responseVerify=accept">ACCEPT</a>
        <a href="${process.env.SERVER}/auth/verify-client?verifyId=${generateVerifyId}&responseVerify=cancel">CANCEL</a>
        `,
                'html',
            );
            await sendMail(
                data.email,
                'soundinfluencers',
                `<p>Dear ${data.firstName},</p>
      <p>Hello,</p>
      <p>Thank you for submitting your account request. We will inform you of the outcome shortly.</p>
      <p>Best regards,</p>
      <p>The SoundInfluencers.com Team</p>`,
                'html',
            );

            return {
                code: 201,
                newUser,
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
            };
        }
    }

    async createInfluencer(data: CreateInfluencerDto) {
        try {
            if (!data) {
                return {
                    status: 400,
                    message: 'Not enough arguments',
                };
            }

            const checkUser = await (async () => {
                const checkInfluencer = await this.influencerModel.findOne({
                    email: data.email,
                });

                if (checkInfluencer) return checkInfluencer;

                const checkClient = await this.clientModel.findOne({
                    email: data.email,
                });
                if (checkClient) return checkClient;

                return null;
            })();

            if (!checkUser) {
            } else {
                return {
                    code: 409,
                    message: 'This user already exists',
                };
            }

            const checkUserInstagram = await (async () => {
                const listInfluencer = await this.influencerModel.find({});

                let isHaveInstagramInfluencer = false;

                const dataInstagramLogin = data.instagram.map((item) => {
                    return item.instagramUsername;
                });

                await Promise.all(
                    listInfluencer.map(async (item) => {
                        item.instagram.forEach((ins) => {
                            if (dataInstagramLogin.includes(ins.instagramUsername)) {
                                isHaveInstagramInfluencer = true;
                            }
                        });
                    }),
                );

                if (isHaveInstagramInfluencer) return true;

                let isHaveInstagramClient = false;
                await Promise.all(
                    data.instagram.map(async (item) => {
                        const checkClient = await this.clientModel.findOne({
                            instagramUsername: item.instagramUsername,
                        });

                        if (checkClient) {
                            isHaveInstagramClient = true;
                        }
                    }),
                );

                if (isHaveInstagramClient) return true;

                return null;
            })();

            if (checkUserInstagram) {
                return {
                    code: 409,
                    message: 'This instagram already exists',
                };
            }

            const checkInstagram = data.instagram.map((item) => {
                if (item.musicStyle === 'Other' && item.musicStyleOther) {
                    return {
                        ...item,
                        musicStyle: item.musicStyleOther[0],
                    };
                } else {
                    return {
                        ...item,
                        musicStyle: item.musicStyle,
                    };
                }
            });

            const newUser = await this.influencerModel.create({
                ...data,
                instagram: checkInstagram,
                password: bcrypt.hashSync(data.password),
            });

            const generateVerifyId = generateRandomString();

            await this.verifyInfluencerModel.create({
                influencerId: newUser._id,
                verifyId: generateVerifyId,
            });
            // TODO: add another social medias
            await sendMail(
                'admin@soundinfluencers.com',
                'soundinfluencers',
                `<p>Request from a new partner ${
                    data.firstName
                }</p><b>Details:</b><br/><br/><p>First Name: ${data.firstName}</p>
        ${data.instagram.map(
                    (item, index) =>
                        ` <p>(${index + 1}) Music Style: ${item.musicStyle}</p>
            <p>(${index + 1}) Instagram: ${item.instagramUsername}</p>
            <p>(${index + 1}) Instagram Link: ${item.instagramLink}</p>
          <p>(${index + 1}) Followers Number: ${item.followersNumber}</p>,
          <p>(${index + 1}) Logo: ${item.logo}</p>,
          <p>(${index + 1}) Price: ${item.price}</p>`,
                )}
        <p>Email: ${data.email}</p>
        <p>Phone: ${data.phone}</p>
        <h2>Do you want to verify your account?</h2>
        <a href="${
                    process.env.SERVER
                }/auth/verify-influencer?verifyId=${generateVerifyId}&responseVerify=accept">ACCEPT</a>
        <a href="${
                    process.env.SERVER
                }/auth/verify-influencer?verifyId=${generateVerifyId}&responseVerify=cancel">CANCEL</a>
        `,
                'html',
            );
            await sendMail(
                data.email,
                'soundinfluencers',
                `<p>Dear ${data.firstName},</p>
      <p>Thank you for your subscription request submission.</p>
      <p>An email with a status update will be sent to you soon.</p>
      <p>Best regards,</p>
      <p>SoundInfluencers team</p>`,
                'html',
            );
            return {
                code: 201,
                newUser,
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
            };
        }
    }

    async verifyAdminInfluencer(verifyId: string, responseVerify: string) {
        if (!verifyId || !responseVerify) {
            return {
                status: 400,
                message: 'Not enough arguments',
            };
        }

        const checkVerifyAdmin = await this.verifyInfluencerModel.findOne({
            verifyId: verifyId,
        });

        if (!checkVerifyAdmin) {
            return {
                code: 404,
                message: 'not found',
            };
        }

        const checkInfluencer = await this.influencerModel.findOne({
            _id: checkVerifyAdmin.influencerId,
        });

        if (!checkInfluencer) {
            return {
                code: 404,
                message: 'influencer not found ',
            };
        }

        if (responseVerify === 'accept') {
            await this.influencerModel.findOneAndUpdate(
                {_id: checkInfluencer._id},
                {statusVerify: responseVerify},
            );

            await this.verifyInfluencerModel.findOneAndDelete({verifyId: verifyId});

            sendMail(
                checkInfluencer.email,
                'soundinfluencers',
                `<p>Dear ${checkInfluencer.firstName},</p>
        <p>Thank you for confirming your information with us. Your account details have been successfully verified.</p> 
        <p>You can now access your personal account by clicking on the link below:</p>
        <a href="${process.env.SERVER_CLIENT}/login/influencer" style="font-weight: 600">*Access Link*</a>
        <p>If you have any questions or encounter any issues, please don't hesitate to contact our support team or reply to this message.</p>
        <p>Best regards,</p>
        <p>SoundInfluencers team</p>`,
                'html',
            );

            return {
                code: 200,
                message: 'influencer verify',
            };
        } else if (responseVerify === 'cancel') {
            await this.influencerModel.findOneAndUpdate(
                {_id: checkInfluencer._id},
                {statusVerify: responseVerify},
            );

            await this.verifyInfluencerModel.findOneAndDelete({verifyId: verifyId});
            sendMail(
                checkInfluencer.email,
                'soundinfluencers',
                `<p>Hi,</p>
      <p>thanks for the application!</p>
      <p>Unfortunately we're not sure there's a good fit for us right now.</p>
      <p>We suggest trying again in the future 🙂</p> 
      <p>Best Regards</p><p>SoundInfluencers Team</p>`,
                'html',
            );
            return {
                code: 200,
                message: 'influencer not verify',
            };
        } else {
            return {
                code: 200,
                message: 'response verify is not correct',
            };
        }
    }

    async verifyAdminClient(verifyId: string, responseVerify: string) {
        if (!verifyId || !responseVerify) {
            return {
                status: 400,
                message: 'Not enough arguments',
            };
        }

        const checkVerifyAdmin = await this.verifyClientModel.findOne({
            verifyId: verifyId,
        });

        if (!checkVerifyAdmin) {
            return {
                code: 404,
                message: 'not found',
            };
        }

        const checkClient = await this.clientModel.findOne({
            _id: checkVerifyAdmin.clientId,
        });

        if (!checkClient) {
            return {
                code: 404,
                message: 'client not found ',
            };
        }

        if (responseVerify === 'accept') {
            await this.clientModel.findOneAndUpdate(
                {_id: checkClient._id},
                {statusVerify: responseVerify},
            );

            await this.verifyClientModel.findOneAndDelete({verifyId: verifyId});

            sendMail(
                checkClient.email,
                'soundinfluencers',
                `<p>Dear ${checkClient.firstName},</p>
<p>Thank you for confirming your information with us. Your account details have been successfully verified.</p>
<p>You can now access your personal account by clicking on the link below:</p>
<a href="${process.env.SERVER_CLIENT}/login/client" style="font-weight: 600">*Access Link*</a>
<p>If you have any questions or encounter any issues, please don't hesitate to contact our support team or reply to this message.</p>
<p>Best regards,</p>
<p>SoundInfluencers team</p>`,
                'html',
            );

            return {
                code: 200,
                message: 'client verify',
            };
        } else if (responseVerify === 'cancel') {
            await this.clientModel.findOneAndUpdate(
                {_id: checkClient._id},
                {statusVerify: responseVerify},
            );

            await this.verifyClientModel.findOneAndDelete({verifyId: verifyId});
            sendMail(
                checkClient.email,
                'soundinfluencers',
                `<p>Hi,</p>
      <p>thanks for the application!</p>
      <p>Unfortunately we're not sure there's a good fit for us right now.</p>
      <p>We suggest trying again in the future 🙂</p> 
      <p>Best Regards</p><p>SoundInfluencers Team</p>`,
                'html',
            );
            return {
                code: 200,
                message: 'client not verify',
            };
        } else {
            return {
                code: 200,
                message: 'response verify is not correct',
            };
        }
    }

    async loginClient(loginClient: LoginClientDto) {
        if (!loginClient.email || !loginClient.password) {
            return {
                code: 400,
                message: 'Not enough arguments',
            };
        }

        const checkUser = await this.clientModel.findOne({
            email: loginClient.email,
        });

        if (!checkUser) {
            return {
                code: 404,
                message: 'Not Found',
            };
        }

        if (bcrypt.compareSync(loginClient.password, checkUser.password)) {
            if (checkUser.statusVerify === 'wait') {
                return {
                    code: 403,
                    message: 'not verify account',
                };
            }
            return {
                code: 200,
                token: jwt.sign(
                    {id: checkUser.id, role: checkUser.role},
                    this.secretKey,
                ),
            };
        } else {
            return {
                code: 400,
                message: 'Password is not correct',
            };
        }
    }

    async loginInfluencer(loginInfluencer: LoginClientDto) {
        if (!loginInfluencer.email || !loginInfluencer.password) {
            return {
                code: 400,
                message: 'Not enough arguments',
            };
        }

        const checkUser = await this.influencerModel.findOne({
            email: loginInfluencer.email,
        });

        if (!checkUser) {
            return {
                code: 404,
                message: 'Not Found',
            };
        }

        if (bcrypt.compareSync(loginInfluencer.password, checkUser.password)) {
            if (checkUser.statusVerify === 'wait') {
                return {
                    code: 403,
                    message: 'not verify account',
                };
            }
            return {
                code: 200,
                token: jwt.sign(
                    {id: checkUser.id, role: checkUser.role},
                    this.secretKey,
                ),
            };
        } else {
            return {
                code: 400,
                message: 'Password is not correct',
            };
        }
    }

    async verify(data: VerifyDto) {
        try {
            if (!data.token) {
                return {
                    code: 400,
                    message: 'Not enough arguments',
                };
            }
            const login = jwt.verify(data.token, this.secretKey);
            const userClient = await this.clientModel.findOne({_id: login.id});
            const userInfluencer = await this.influencerModel.findOne({
                _id: login.id,
            });

            if (login.role === 'client' && userClient) {
                return {
                    code: 200,
                    user: userClient,
                };
            }

            if (login.role === 'influencer' && userInfluencer) {
                return {
                    code: 200,
                    user: userInfluencer,
                };
            }

            return {
                code: 404,
                message: 'Not Found',
            };
        } catch (err) {
            return {
                code: 500,
                message: err,
            };
        }
    }

    async getInfluencers() {
        try {
            const getInfluencersAll = await this.influencerModel
                .find({statusVerify: 'accept'})
                .select(['-password', '-balance', '-phone', '-email'])
                .lean()
                .exec();

            const listInstagram = getInfluencersAll.map((item) => {
                if (!Array.isArray(item.instagram)) return [];
                return item.instagram.map((itemIns) => ({
                    ...itemIns,
                    _id: item._id,
                }));
            });

            return {
                code: 200,
                influencers: listInstagram.flat(),
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    }

    async getInfluencerById(id: string) {
        try {
            const objectId = new Types.ObjectId(id); // Преобразуем строку в ObjectId

            const getInfluencer = await this.influencerModel
                .findOne({_id: objectId})
                .select(['-password', '-balance', '-phone', '-email'])
                .lean()
                .exec();

            return {
                code: 200,
                influencer: getInfluencer,
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