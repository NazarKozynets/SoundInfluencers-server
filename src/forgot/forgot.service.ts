import { Injectable, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Client } from 'src/auth/schemas/client.schema';
import { Influencer } from 'src/auth/schemas/influencer.schema';
import { Forgot } from './schemas/forgot.schema';
import sendMail from 'src/utils/sendMail';
const bcrypt = require('bcryptjs');

function generateFourDigitCode() {
  const code = Math.floor(Math.random() * 9000) + 1000;
  return String(code);
}

function generateRandomPassword() {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters.charAt(randomIndex);
  }

  return password;
}

@Injectable()
export class ForgotService {
  constructor(
    @InjectModel(Client.name)
    private clientModel: mongoose.Model<Client>,
    @InjectModel(Influencer.name)
    private influencerModel: mongoose.Model<Influencer>,
    @InjectModel(Forgot.name)
    private forgotModel: mongoose.Model<Forgot>,
  ) {}

  async forgotEmail(email: string) {
    try {
      if (!email) {
        return {
          status: 400,
          message: 'Not enough arguments',
        };
      }

      const checkUserClient = await this.clientModel.findOne({
        email: email,
      });

      const checkUserInfluencer = await this.influencerModel.findOne({
        email: email,
      });

      if (!(!checkUserClient && !checkUserInfluencer)) {
        if (checkUserClient) {
          const checkForgot = await this.forgotModel.findOne({
            id: checkUserClient.id,
          });

          if (checkForgot) {
            const code = generateFourDigitCode();
            await this.forgotModel.findOneAndUpdate(
              { id: checkUserClient.id },
              {
                code: code,
              },
            );
            await sendMail(
              checkUserClient.email,
              'soundinfluencers',
              `<p>Dear ${checkUserClient.firstName},</p>
            <p>It looks like you've requested a password reset for your account. Please use the following confirmation code to reset your password:</p>
            <p>Confirmation Code: ${code}</p>
            <p>You can reset your password by clicking on the 'Forgot Password' link on our website and entering this confirmation code when prompted.</p>
            <p>If you have any questions or encounter any issues, please don't hesitate to contact our support team or reply to this message.</p>
            <p>Best regards,</p>
            <p>SoundInfluencers team</p>`,
              'html',
            );
            return {
              code: 200,
              message: 'code send',
            };
          } else {
            const code = generateFourDigitCode();
            await this.forgotModel.create({
              id: checkUserClient.id,
              code: code,
            });
            await sendMail(
              checkUserClient.email,
              'soundinfluencers',
              `<p>Dear ${checkUserClient.firstName},</p>
            <p>It looks like you've requested a password reset for your account. Please use the following confirmation code to reset your password:</p>
            <p>Confirmation Code: ${code}</p>
            <p>You can reset your password by clicking on the 'Forgot Password' link on our website and entering this confirmation code when prompted.</p>
            <p>If you have any questions or encounter any issues, please don't hesitate to contact our support team or reply to this message.</p>
            <p>Best regards,</p>
            <p>SoundInfluencers team</p>`,
              'html',
            );
            return {
              code: 200,
              message: 'code send',
            };
          }
        } else {
          const checkForgot = await this.forgotModel.findOne({
            id: checkUserInfluencer.id,
          });
          if (checkForgot) {
            const code = generateFourDigitCode();
            await this.forgotModel.findOneAndUpdate(
              { id: checkUserInfluencer.id },
              {
                code: code,
              },
            );
            await sendMail(
              checkUserInfluencer.email,
              'soundinfluencers',
              `<p>Dear ${checkUserInfluencer.firstName},</p>
            <p>It looks like you've requested a password reset for your account. Please use the following confirmation code to reset your password:</p>
            <p>Confirmation Code: ${code}</p>
            <p>You can reset your password by clicking on the 'Forgot Password' link on our website and entering this confirmation code when prompted.</p>
            <p>If you have any questions or encounter any issues, please don't hesitate to contact our support team or reply to this message.</p>
            <p>Best regards,</p>
            <p>SoundInfluencers team</p>`,
              'html',
            );
            return {
              code: 200,
              message: 'code send',
            };
          } else {
            const code = generateFourDigitCode();
            await this.forgotModel.create({
              id: checkUserInfluencer.id,
              code: code,
            });

            await sendMail(
              checkUserInfluencer.email,
              'soundinfluencers',
              `<p>Dear ${checkUserInfluencer.firstName},</p>
            <p>It looks like you've requested a password reset for your account. Please use the following confirmation code to reset your password:</p>
            <p>Confirmation Code: ${code}</p>
            <p>You can reset your password by clicking on the 'Forgot Password' link on our website and entering this confirmation code when prompted.</p>
            <p>If you have any questions or encounter any issues, please don't hesitate to contact our support team or reply to this message.</p>
            <p>Best regards,</p>
            <p>SoundInfluencers team</p>`,
              'html',
            );
            return {
              code: 200,
              message: 'code send',
            };
          }
        }
      }

      return {
        code: 404,
        message: 'User not found',
      };
    } catch (err) {
      console.log(err);
      return {
        code: 500,
        message: err,
      };
    }
  }

  async forgotCode(email: string, code: string) {
    try {
      if (!email || !code) {
        return {
          status: 400,
          message: 'Not enough arguments',
        };
      }

      const checkUserClient = await this.clientModel.findOne({
        email: email,
      });

      const checkUserInfluencer = await this.influencerModel.findOne({
        email: email,
      });

      if (!(!checkUserClient && !checkUserInfluencer)) {
        if (checkUserClient) {
          const checkForgot = await this.forgotModel.findOne({
            id: checkUserClient.id,
          });

          if (checkForgot) {
            if (checkForgot.code !== code) {
              return {
                code: 400,
                message: 'code is not correct ',
              };
            }

            const newPassword = generateRandomPassword();
            await this.forgotModel.findOneAndDelete({ id: checkUserClient.id });

            await sendMail(
              checkUserClient.email,
              'soundinfluencers',
              `<p>Dear ${checkUserClient.firstName},</p>
               <p>This is your temporary password: ${newPassword}</p>
               <p>Best regards,</p>
               <p>SoundInfluencers team</p>`,
              'html',
            );
            await this.clientModel.findOneAndUpdate(
              { _id: checkUserClient._id },
              {
                password: bcrypt.hashSync(newPassword),
              },
            );

            return {
              code: 200,
              message: 'password send',
            };
          }
        } else {
          const checkForgot = await this.forgotModel.findOne({
            id: checkUserInfluencer.id,
          });
          if (checkForgot) {
            if (checkForgot.code !== code) {
              return {
                code: 400,
                message: 'code is not correct ',
              };
            }
            const newPassword = generateRandomPassword();
            await this.forgotModel.findOneAndDelete({
              id: checkUserInfluencer.id,
            });

            await sendMail(
              checkUserInfluencer.email,
              'soundinfluencers',
              `<p>Dear ${checkUserInfluencer.firstName},</p>
               <p>This is your temporary password: ${newPassword}</p>
               <p>Best regards,</p>
               <p>SoundInfluencers team</p>`,
              'html',
            );
            await this.clientModel.findOneAndUpdate(
              { _id: checkUserInfluencer._id },
              {
                password: bcrypt.hashSync(newPassword),
              },
            );

            return {
              code: 200,
              message: 'password send',
            };
          }
        }
      }

      return {
        code: 404,
        message: 'User not found',
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
