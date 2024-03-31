import { Injectable } from '@nestjs/common';
import { UpdatePersonalClientDto } from './dto/update-personal-client.dto';
import { Client } from 'src/auth/schemas/client.schema';
import { Influencer } from 'src/auth/schemas/influencer.schema';
import mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdatePasswordClientDto } from './dto/update-password.dto';
import { UpdateCompanyClientDto } from './dto/update-company-client.dto';
import { UpdateEmailClientDto } from './dto/update-email-client.dto';
import { UpdatePhoneClientDto } from './dto/update-phone-client.dto';
import { UpdatePersonalInfluencerDto } from './dto/update-personal-influencer.dto';
import { UpdateMusicStyleInfluencerDto } from './dto/update-music-influencer.dto';
import { UpdateEmailInfluencerDto } from './dto/update-email-influencer.dto';
import { UpdatePhoneInfluencerDto } from './dto/update-phone-influencer.dto';
import sendMail from 'src/utils/sendMail';
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
          instagramUsername: data.instagramUsername,
          refelarCode: data.referalCode,
          logo: data.logo,
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

  async updateCompanyClient(data: UpdateCompanyClientDto) {
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
          company: data.company,
          companyType: data.companyType,
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

  async updateEmailClient(data: UpdateEmailClientDto) {
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
          email: data.email,
        },
      );

      await sendMail(
        checkUser.email,
        'soundinfluencers',
        `<p>Email address has been successfully changed in our system. If you have any questions or need further assistance, please contact our support team</p>`,
        'html',
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

  async updatePhoneClient(data: UpdatePhoneClientDto) {
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
      await this.influencerModel.findOneAndUpdate(
        { _id: data.id },
        {
          firstName: data.firstName,
          instagram: data.instagram,
          influencerName: data.influencerName,
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

  async updateMusicStyleInfluencer(data: UpdateMusicStyleInfluencerDto) {
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
      await this.clientModel.findOneAndUpdate(
        { _id: data.id },
        {
          musicStyle: data.musicStyle,
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

  async updateEmailInfluencer(data: UpdateEmailInfluencerDto) {
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
      await this.influencerModel.findOneAndUpdate(
        { _id: data.id },
        {
          email: data.email,
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

  async updatePhoneInfluencer(data: UpdatePhoneInfluencerDto) {
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
      await this.clientModel.findOneAndUpdate(
        { _id: data.id },
        {
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
}
