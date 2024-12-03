import { Injectable } from '@nestjs/common';
import { UpdatePersonalClientDto } from './dto/update-personal-client.dto';
import { Client } from 'src/auth/schemas/client.schema';
import { Influencer } from 'src/auth/schemas/influencer.schema';
import mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdatePasswordClientDto } from './dto/update-password.dto';
import { UpdatePersonalInfluencerDto } from './dto/update-personal-influencer.dto';
import {UpdateSocialMediaAccountDto} from "./dto/update-social-media-account.dto";
const bcrypt = require('bcryptjs');

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Client.name)
    private clientModel: mongoose.Model<Client>,
    @InjectModel(Influencer.name)
    private influencerModel: mongoose.Model<Influencer>,
  ) {}

  async updatePersonalClient(data: UpdatePersonalClientDto) {
    try {
      if (!data) {
        return {
          status: 400,
          message: 'Not enough arguments',
        };
      }

      const checkUser = await this.clientModel.findOne({ _id: data.id });

      if (!checkUser) {
        return {
          code: 404,
          message: 'User not found',
        };
      }
      await this.clientModel.findOneAndUpdate(
        { _id: data.id },
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
  }

  async updatePersonalInfluencer(data: UpdatePersonalInfluencerDto) {
    try {
      if (!data) {
        return {
          status: 400,
          message: 'Not enough arguments',
        };
      }

      const checkUser = await this.influencerModel.findOne({ _id: data.id });

      if (!checkUser) {
        return {
          code: 404,
          message: 'User not found',
        };
      }
      const updatedUser = await this.influencerModel.findOneAndUpdate(
          { _id: data.id },
          {
            firstName: data.firstName,
            email: data.email,
            phone: data.phone,
          },
          { new: true } 
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
  }

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
        const checkUser = await this.clientModel.findOne({ _id: data.id });

        if (!checkUser) {
          return {
            code: 404,
            message: 'User not found',
          };
        }

        if (bcrypt.compareSync(data.currentPassword, checkUser.password)) {
          await this.clientModel.findOneAndUpdate(
            { _id: data.id },
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
        const checkUser = await this.influencerModel.findOne({ _id: data.id });

        if (!checkUser) {
          return {
            code: 404,
            message: 'User not found',
          };
        }

        if (bcrypt.compareSync(data.currentPassword, checkUser.password)) {
          await this.influencerModel.findOneAndUpdate(
            { _id: data.id },
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
  }

  async updateSocialMediaAccount(data: UpdateSocialMediaAccountDto) {
    try {
      if (!data) {
        return {
          code: 400,
          message: 'Not enough arguments',
        };
      }

      const influencer = await this.influencerModel.findOne({ _id: data._id });
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
  }

}
