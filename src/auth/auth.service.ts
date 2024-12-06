import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {CreateClientDto} from './dto/create-client.dto';
import {CreateInfluencerDto} from './dto/create-influencer.dto';
import {Client} from './schemas/client.schema';
import mongoose from 'mongoose';
import {Types} from 'mongoose';
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
                balance: 0,
            });

            const generateVerifyId = generateRandomString();

            await this.verifyClientModel.create({
                clientId: newUser._id,
                verifyId: generateVerifyId,
            });

            await sendMail(
                // 'nazarkozynets030606@zohomail.eu',
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
                return {status: 400, message: 'Not enough arguments'};
            }

            const checkUser = await this.influencerModel.findOne({email: data.email})
                || await this.clientModel.findOne({email: data.email});

            if (checkUser) {
                return {code: 409, message: 'This user already exists'};
            }

            const socialNetworks = ['instagram', 'tiktok', 'spotify', 'soundcloud', 'facebook', 'youtube', 'press'];

            for (const network of socialNetworks) {
                const accounts = data[network] || [];
                const usernames = accounts.map((item) => item.instagramUsername);

                const networkFilter = {
                    [`${network}.instagramUsername`]: {$in: usernames},
                    isDeleted: {$ne: true}
                };
                const isUsernameUsed = await this.influencerModel.exists(networkFilter);

                if (isUsernameUsed) {
                    return {code: 409, message: `This ${network} username already exists`};
                }
            }

            const processedData = {};
            for (const network of socialNetworks) {
                const accounts = data[network] || [];

                processedData[network] = accounts.map((item) => {
                    const musicStyle = item.musicStyle === 'Other' && item.musicStyleOther
                        ? item.musicStyleOther[0]
                        : item.musicStyle;

                    const sanitizedPrice = parseFloat(String(item.price).replace(/[^\d.-]/g, '')) || 0;
                    const publicPrice = (sanitizedPrice * 2).toString();

                    return {
                        ...item,
                        musicStyle: musicStyle,
                        publicPrice: publicPrice,
                        isHidden: false,
                        isDeleted: false,
                    };
                });
            }

            const newUser = await this.influencerModel.create({
                ...data,
                ...processedData, 
                password: bcrypt.hashSync(data.password),
            });

            const generateVerifyId = generateRandomString();
            await this.verifyInfluencerModel.create({
                influencerId: newUser._id,
                verifyId: generateVerifyId,
            });

            const formatGenres = (item) => {
                const genresSet = new Set<string>();
                if (item.musicStyle || item.musicSubStyles || item.musicStyleOther) {
                    if (item.musicSubStyles?.length > 0) {
                        for (const subStyle of item.musicSubStyles) {
                            if (subStyle === "Melodic, Minimal") {
                                genresSet.add("Techno (Melodic, Minimal)");
                            }
                            if (subStyle === "Hard, Peak") {
                                genresSet.add("Techno (Hard, Peak)");
                            }
                            if (subStyle === "Tech House") {
                                genresSet.add("House (Tech House)");
                            }
                            if (subStyle === "Melodic, Afro") {
                                genresSet.add("House (Melodic, Afro)");
                            }
                        }
                    } else if (item.musicStyle) {
                        genresSet.add(item.musicStyle);
                    }

                    if (item.musicStyleOther?.length > 0) {
                        for (const otherStyle of item.musicStyleOther) {
                            if (otherStyle !== "House") {
                                genresSet.add(otherStyle);
                            }
                        }
                    }
                }
                return Array.from(genresSet);
            };

            await sendMail(
                'nazarkozynets030606@gmail.com',
                // 'admin@soundinfluencers.com',
                'soundinfluencers',
                `<p>Request from a new partner ${data.firstName}</p>
            <b>Details:</b><br/><p>First Name: ${data.firstName}</p>
            <p>Email: ${data.email}</p>
            <p>Phone: ${data.phone}</p>
            <br/>
            ${socialNetworks.map((network) => data[network]?.map((item, index) => `
                <p><strong>Network: ${network} (${index + 1} account)</strong></p>
                
            <ul>
            <li><strong>Username: ${item.instagramUsername}</strong></li>
            <li><strong>Link: ${item.instagramLink}</strong></li>
            <li><strong>Followers: ${item.followersNumber}</strong></li>
            <li><strong>Logo: ${item.logo}</strong></li>
            <li><strong>Music Styles: ${formatGenres(item).join(', ')}</strong></li>
            <li><strong>Price: ${item.price}€</strong></li>
</ul>`).join('')).join('')}
            <h2>Do you want to verify your account?</h2>
            <a href="${process.env.SERVER}/auth/verify-influencer?verifyId=${generateVerifyId}&responseVerify=accept">ACCEPT</a>
            <a href="${process.env.SERVER}/auth/verify-influencer?verifyId=${generateVerifyId}&responseVerify=cancel">CANCEL</a>`,
                'html',
            );

            await sendMail(
                data.email,
                'soundinfluencers',
                `<p>Dear ${data.firstName},</p>
            <p>Thank you for submitting your subscription request.</p>
            <p>We will send you an email with a status update shortly.</p>
            <p>Best regards,</p>
            <p>The SoundInfluencers Team</p>`,
                'html',
            );

            return {code: 201, newUser};
        } catch (err) {
            console.log(err);
            return {code: 500};
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

    async getInfluencersWithSocialMedia(socialMedia: string) {
        try {
            const getInfluencersAll = await this.influencerModel
                .find({ statusVerify: 'accept' })
                .select(['-password', '-balance', '-phone', '-email'])
                .lean()
                .exec();

            const influencersList = getInfluencersAll.map((item) => {
                const socialMediaAccounts = item[socialMedia];

                if (Array.isArray(socialMediaAccounts)) {
                    return socialMediaAccounts
                        .filter((account) => account.isHidden !== true && account.isDeleted !== true)
                        .map((account) => ({
                            ...account,
                            _id: item._id, 
                        }));
                }

                return [];
            });

            return {
                code: 200,
                influencers: influencersList.flat(), 
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err.message || 'An error occurred while fetching influencers.',
            };
        }
    }

    
    async getInfluencersWithoutSocialMedia() {
        try {
            const influencers = await this.influencerModel
                .find({ statusVerify: 'accept' }) 
                .select(['-password', '-balance', '-phone', '-email']) 
                .lean()
                .exec();

            const allAccounts = influencers.map((influencer) => {
                const socialMediaKeys = ['instagram', 'tiktok', 'spotify', 'soundcloud', 'facebook', 'youtube', 'press'];

                const accounts = socialMediaKeys.flatMap((socialMedia) => {
                    const socialMediaAccounts = influencer[socialMedia];
                    if (Array.isArray(socialMediaAccounts)) {
                        return socialMediaAccounts
                            .filter((account) => account.isHidden !== true) 
                            .map((account) => ({
                                ...account,
                                socialMedia, 
                                _id: influencer._id, 
                                firstName: influencer.firstName,
                            }));
                    }
                    return [];
                });

                return accounts;
            });

            return {
                code: 200,
                influencers: allAccounts.flat(),
            };
        } catch (err) {
            console.error(err);
            return {
                code: 500,
                message: err.message || 'An error occurred while fetching all influencer accounts.',
            };
        }
    }

    async getClients() {
        try {
            const getClientsAll = await this.clientModel
                .find({statusVerify: 'accept'})
                .select(['-password'])
                .lean()
                .exec();

            return {
                code: 200,
                clients: getClientsAll,
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
            const objectId = new Types.ObjectId(id);

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

    async getClientById(id: string) {
        try {
            const objectId = new Types.ObjectId(id);

            const getClient = await this.clientModel
                .findOne({_id: objectId})
                .select(['-password'])
                .lean()
                .exec();

            return {
                code: 200,
                client: getClient,
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