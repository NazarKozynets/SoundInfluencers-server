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

const bcrypt = require('bcryptjs');

@Injectable()
export class ProfileService {
    constructor(
        @InjectModel(Client.name)
        private clientModel: mongoose.Model<Client>,
        @InjectModel(Influencer.name)
        private influencerModel: mongoose.Model<Influencer>,
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
        
        for (const network of socialNetworks) {
            const accounts = data[network] || [];
            const socialMediaAccounts = influencer[network] || [];
            
            try {
                for (const account of accounts) {
                    const sanitizedPrice = parseFloat(String(account.price).replace(/[^\d.-]/g, '')) || 0;
                    const publicPrice = (sanitizedPrice * 2).toString();
                    
                    socialMediaAccounts.push({
                        ...account,
                        publicPrice: publicPrice,
                        isHidden: false,
                        isDeleted: false,
                    });
                }

                influencer[network] = socialMediaAccounts;
            } catch (err) {
                console.error('Error adding social media account:', err);
                errors.push(`Error adding ${network} account. ${err}`);
            }
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
}
