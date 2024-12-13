import {Injectable} from '@nestjs/common';
import {UpdatePersonalClientDto} from './dto/update-personal-client.dto';
import {Client} from 'src/auth/schemas/client.schema';
import {Influencer} from 'src/auth/schemas/influencer.schema';
import mongoose from 'mongoose';
import {InjectModel} from '@nestjs/mongoose';
import {UpdatePasswordClientDto} from './dto/update-password.dto';
import {UpdatePersonalInfluencerDto} from './dto/update-personal-influencer.dto';
import {UpdateSocialMediaAccountDto} from "./dto/update-social-media-account.dto";
import sendMail from "src/utils/sendMail";
import {AddSocialMediasDto} from "./dto/add-social-medias.dto";
import {SendMailPriceChangeDto} from "./dto/send-mail-price-change.dto";
import * as process from "node:process";
import {AppGateway} from "../websocket/app.gateway";

const bcrypt = require('bcryptjs');

@Injectable()
export class ProfileService {
    constructor(
        @InjectModel(Client.name)
        private clientModel: mongoose.Model<Client>,
        @InjectModel(Influencer.name)
        private influencerModel: mongoose.Model<Influencer>,
        private readonly webSocketService: AppGateway,
    ) {
    }

    async updatePersonalClient(data: UpdatePersonalClientDto) {
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
                    firstName: data.firstName,
                    company: data.company,
                    email: data.email,
                    phone: data.phone,
                },
            );

            return {
                code: 200,
                message: 'personal data update',
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    };

    async updatePersonalInfluencer(data: UpdatePersonalInfluencerDto) {
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
            const updatedUser = await this.influencerModel.findOneAndUpdate(
                {_id: data.id},
                {
                    firstName: data.firstName,
                    email: data.email,
                    phone: data.phone,
                },
                {new: true}
            );
            return {
                code: 200,
                message: 'personal data update',
                data: {
                    firstName: updatedUser.firstName,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                },
            };
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    };

    async updatePasswordClient(data: UpdatePasswordClientDto) {
        try {
            if (!data) {
                return {
                    status: 400,
                    message: 'Not enough arguments',
                };
            }

            if (data.role === undefined) {
                return {
                    status: 400,
                    message: 'role is not correct',
                };
            }

            if (data.role === 'client') {
                const checkUser = await this.clientModel.findOne({_id: data.id});

                if (!checkUser) {
                    return {
                        code: 404,
                        message: 'User not found',
                    };
                }

                if (bcrypt.compareSync(data.currentPassword, checkUser.password)) {
                    await this.clientModel.findOneAndUpdate(
                        {_id: data.id},
                        {
                            password: bcrypt.hashSync(data.newPassword),
                        },
                    );

                    return {
                        code: 200,
                        message: 'personal data update',
                    };
                }

                return {
                    code: 400,
                    message: 'Password is not correct',
                };
            } else if (data.role === 'influencer') {
                const checkUser = await this.influencerModel.findOne({_id: data.id});

                if (!checkUser) {
                    return {
                        code: 404,
                        message: 'User not found',
                    };
                }

                if (bcrypt.compareSync(data.currentPassword, checkUser.password)) {
                    await this.influencerModel.findOneAndUpdate(
                        {_id: data.id},
                        {
                            password: bcrypt.hashSync(data.newPassword),
                        },
                    );

                    return {
                        code: 200,
                        message: 'personal data update',
                    };
                }

                return {
                    code: 400,
                    message: 'Password is not correct',
                };
            } else {
                return {
                    code: 400,
                    message: 'role is not correct',
                };
            }
        } catch (err) {
            console.log(err);
            return {
                code: 500,
                message: err,
            };
        }
    };

    async updateSocialMediaAccount(data: UpdateSocialMediaAccountDto) {
        try {
            if (!data) {
                return {
                    code: 400,
                    message: 'Not enough arguments',
                };
            }

            const influencer = await this.influencerModel.findOne({_id: data._id});
            if (!influencer) {
                return {
                    code: 404,
                    message: 'User not found',
                };
            }

            const socialMediaAccounts = influencer[data.typeOfSocialMedia];
            if (!socialMediaAccounts || socialMediaAccounts.length === 0) {
                return {
                    code: 404,
                    message: `No accounts found for type: ${data.typeOfSocialMedia}`,
                };
            }

            const accountIndex = socialMediaAccounts.findIndex(
                (account) => account._id.toString() === data.accountId
            );

            if (accountIndex === -1) {
                return {
                    code: 404,
                    message: 'Account not found',
                };
            }


            socialMediaAccounts[accountIndex] = {
                ...socialMediaAccounts[accountIndex],
                instagramUsername: data.instagramUsername,
                instagramLink: data.instagramLink,
                followersNumber: data.followersNumber,
                logo: data.logo,
                musicStyle: data.musicStyle,
                musicSubStyles: data.musicSubStyles,
                musicStyleOther: data.musicStyleOther,
                countries: data.countries,
                categories: data.categories,
                price: data.price,
                publicPrice: data.publicPrice,
            };

            influencer[data.typeOfSocialMedia] = socialMediaAccounts;
            await influencer.save();

            return {
                code: 200,
                message: 'Social media account updated successfully',
            };
        } catch (err) {
            console.error('Error updating social media account:', err);
            return {
                code: 500,
                message: 'Internal server error',
            };
        }
    };

    async sendMailAboutChangingPrice(data: SendMailPriceChangeDto) {
        if (!data) {
            return {
                code: 400,
                message: 'Not enough arguments',
            };
        }

        const influencer = await this.influencerModel.findOne({_id: data.influencerId});

        if (!influencer) {
            return {
                code: 404,
                message: 'User not found',
            };
        }

        const socialMediaAccounts = influencer[data.typeOfSocialMedia];

        if (!socialMediaAccounts || socialMediaAccounts.length === 0) {
            return {
                code: 404,
                message: `No accounts found for type: ${data.typeOfSocialMedia}`,
            };
        }

        const accountIndex = socialMediaAccounts.findIndex(
            (account) => account._id.toString() === data.accountId
        );

        if (accountIndex === -1) {
            return {
                code: 404,
                message: 'Account not found',
            };
        }

        const account = socialMediaAccounts[accountIndex];

        const emailContent = `
            <p>Hi,</p>
            <p>The Influencer <strong>${influencer.firstName}</strong> changed the price for <strong>${data.typeOfSocialMedia}</strong> account <strong>${account.instagramUsername}</strong></p>
            <br>
        `;

        await sendMail(
            // "nazarkozynets030606@zohomail.eu",
            "admin@soundinfluencers.com",
            "soundinfluencers",
            emailContent,
            "html"
        );

        return {
            code: 200,
            message: 'Email sent successfully',
        };
    };

    async deleteSocialMediaAccount(data: any) {
        try {
            if (!data) {
                return {
                    code: 400,
                    message: 'Not enough arguments',
                };
            }

            const influencer = await this.influencerModel.findOne({_id: data._id});
            if (!influencer) {
                return {
                    code: 404,
                    message: 'User not found',
                };
            }

            const socialMediaAccounts = influencer[data.typeOfSocialMedia];
            if (!socialMediaAccounts || socialMediaAccounts.length === 0) {
                return {
                    code: 404,
                    message: `No accounts found for type: ${data.typeOfSocialMedia}`,
                };
            }

            const accountIndex = socialMediaAccounts.findIndex(
                (account) => account._id.toString() === data.accountId
            );

            if (accountIndex === -1) {
                return {
                    code: 404,
                    message: 'Account not found',
                };
            }

            socialMediaAccounts[accountIndex].isDeleted = true;

            influencer[data.typeOfSocialMedia] = socialMediaAccounts;
            const socialMediaAccountName = socialMediaAccounts[accountIndex].instagramUsername;

            await influencer.save();

            const emailContent = `
                <p>Hi,</p>
                <p>The Influencer <strong>${influencer.firstName}</strong> deleted <strong>${data.typeOfSocialMedia}</strong> account <strong>${socialMediaAccountName}</strong></p>
                <br>
                ${data.deleteReason ? `<p><strong>Reason:</strong> ${data.deleteReason}</p>` : ''}
            `;

            await sendMail(
                // "nazarkozynets030606@zohomail.eu",
                "admin@soundinfluencers.com",
                "soundinfluencers",
                emailContent,
                "html"
            );

            return {
                code: 200,
                message: 'Social media account deleted successfully',
            };
        } catch (err) {
            console.error('Error deleting social media account:', err);
            return {
                code: 500,
                message: 'Internal server error',
            };
        }
    };

    async addSocialMediaAccounts(data: AddSocialMediasDto) {
        let errors = [];

        if (!data) {
            errors.push('Not enough arguments');
            return {
                code: 400,
                message: 'Not enough arguments',
                errors,
            };
        }

        const influencer = await this.influencerModel.findOne({_id: data.influencerId});

        if (!influencer) {
            errors.push('User not found');
            return {
                code: 404,
                message: 'User not found',
                errors,
            };
        }

        const socialNetworks = ['instagram', 'tiktok', 'spotify', 'soundcloud', 'facebook', 'youtube', 'press'];

        let dataToSendWithEmail = {
            influencerId: influencer._id,
            accounts: [],
        };
        
        for (const network of socialNetworks) {
            const accounts = data[network] || [];
            const usernames = accounts.map((item) => item.instagramUsername);

            const networkFilter = {
                [`${network}.instagramUsername`]: {$in: usernames},
                isDeleted: {$ne: true}
            };
            const isUsernameUsed = await this.influencerModel.exists(networkFilter);

            if (isUsernameUsed) {
                errors.push(`This ${network} username already exists`);
                return {
                    code: 409,
                    message: `This ${network} username already exists`,
                    errors
                };
            }
        }

        const emailContent = (socialMedia, item) => {
            if (socialMedia === 'spotify' || socialMedia === 'soundcloud') {
                return `
                    <ul>
            <li><strong>${socialMedia === 'spotify' ? 'Spotify playlist name' : 'SoundCloud account name'}: ${item.instagramUsername}</strong></li>
            <li><strong>${socialMedia === 'spotify' ? 'Spotify playlist link' : 'SoundCloud link'}: ${item.instagramLink}</strong></li>
            <li><strong>Followers: ${item.followersNumber}</strong></li>
            <li><strong>Logo: ${item.logo}</strong></li>
            <li><strong>Price: ${item.price}€</strong></li>
</ul>
                `;
            } else if (socialMedia === 'press') {
                return `
                    <ul>
            <li><strong>Brand account name: ${item.instagramUsername}</strong></li>
            <li><strong>Website link: ${item.instagramLink}</strong></li>
            <li><strong>Website link: ${item.followersNumber}</strong></li>
            <li><strong>Logo: ${item.logo}</strong></li>
            <li><strong>Music Genres: ${formatGenres(item).join(', ')}</strong></li>
            <li><strong>Price: ${item.price}€</strong></li>
            `;
            } else {
                return `
                    <ul>
            <li><strong>Username: ${item.instagramUsername}</strong></li>
            <li><strong>Link: ${item.instagramLink}</strong></li>
            <li><strong>Followers: ${item.followersNumber}</strong></li>
            <li><strong>Logo: ${item.logo}</strong></li>
            <li><strong>Music Styles: ${formatGenres(item).join(', ')}</strong></li>
            <li><strong>Price: ${item.price}€</strong></li>
</ul>
                `;
            }
        };
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

        for (const network of socialNetworks) {
            const accounts = data[network] || [];
            const socialMediaAccounts = influencer[network] || [];

            try {
                for (const account of accounts) {
                    const sanitizedPrice = parseFloat(String(account.price).replace(/[^\d.-]/g, '')) || 0;
                    const publicPrice = (sanitizedPrice * 2).toString();
                    const accountId = new mongoose.Types.ObjectId();
                    socialMediaAccounts.push({
                        ...account,
                        publicPrice: publicPrice,
                        isHidden: false,
                        isDeleted: false,
                        isVerified: false,
                        _id: accountId,
                    });

                    influencer[network] = socialMediaAccounts;
                    
                    dataToSendWithEmail.accounts.push(accountId);
                }
            } catch (err) {
                console.error('Error adding social media account:', err);
                errors.push(`Error adding ${network} account. ${err}`);
            }
        }
        
        try {
            await sendMail(
                // 'nazarkozynets030606@gmail.com',
                'admin@soundinfluencers.com',
                'soundinfluencers',
                `<p>Request from ${influencer.firstName} (${influencer.email}) to add a new Brand</p>
            <b>Details:</b><br/>
            ${socialNetworks.map((network) => data[network]?.map((item, index) => `
                <p><strong>Network: ${network} (${index + 1} account)</strong></p>
                
                ${emailContent(network, item)}
            `).join('')).join('')}
            
            <h2>Do you want to verify these accounts?</h2>
<a href="${process.env.SERVER}/profile/influencer/verify-new-brand?influencerId=${dataToSendWithEmail.influencerId}&accounts=${encodeURIComponent(JSON.stringify(dataToSendWithEmail.accounts))}&isVerified=${true}">ACCEPT</a>
        <a href="${process.env.SERVER}/profile/influencer/verify-new-brand?influencerId=${dataToSendWithEmail.influencerId}&accounts=${encodeURIComponent(JSON.stringify(dataToSendWithEmail.accounts))}&isVerified=${false}">DECLINE</a>
`,
                'html',
            );
        } catch (err) {
            console.error('Error sending email:', err);
            errors.push(`Error sending email. ${err}`);
        }

        if (errors.length > 0) {
            return {
                code: 500,
                message: 'Internal server error',
                errors,
            };
        } else {
            await influencer.save();
            return {
                code: 200,
                message: 'Social media account added successfully',
            };
        }
    };

    async verifyNewSocialMediaAccounts(influencerId: string, accountIds: string[], isVerified: boolean) {
        if (!influencerId || !accountIds || accountIds.length === 0 || isVerified === undefined) {
            return {
                code: 400,
                message: 'Not enough arguments',
            };
        }

        const influencer = await this.influencerModel.findOne({ _id: influencerId });

        if (!influencer) {
            return {
                code: 404,
                message: 'User not found',
            };
        }

        const socialNetworks = ['instagram', 'tiktok', 'spotify', 'soundcloud', 'facebook', 'youtube', 'press'];

        let updatedAccounts = [];
        
        try {
            socialNetworks.forEach((network) => {
                const accounts = influencer[network] || [];

                accounts.forEach((account) => {
                    if (accountIds.includes(account._id.toString())) {
                        account.isVerified = isVerified;
                        updatedAccounts.push({
                            network,
                            account,
                        });
                    }
                });
            });

            await influencer.save();

            this.webSocketService.server.emit('brands approved', {
                    influencerId,
                    updatedAccounts,
                    isVerified,
                });
            
            return {
                code: 200,
                message: 'Social media account(s) updated successfully',
            };
        } catch (err) {
            console.error('Error verifying social media accounts:', err);
            return {
                code: 500,
                message: 'Internal server error',
                errors: [err.message],
            };
        }
    }
}
