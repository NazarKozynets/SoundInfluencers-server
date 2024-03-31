import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdatePersonalClientDto } from './dto/update-personal-client.dto';
import { UpdatePasswordClientDto } from './dto/update-password.dto';
import { UpdateCompanyClientDto } from './dto/update-company-client.dto';
import { UpdateEmailClientDto } from './dto/update-email-client.dto';
import { UpdatePhoneClientDto } from './dto/update-phone-client.dto';
import { UpdatePersonalInfluencerDto } from './dto/update-personal-influencer.dto';
import { UpdateMusicStyleInfluencerDto } from './dto/update-music-influencer.dto';
import { UpdateEmailInfluencerDto } from './dto/update-email-influencer.dto';
import { UpdatePhoneInfluencerDto } from './dto/update-phone-influencer.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Put('client/personal')
  updatePersonalClient(@Body() data: UpdatePersonalClientDto) {
    return this.profileService.updatePersonalClient(data);
  }

  @Put('client/password')
  updatePasswordClient(@Body() data: UpdatePasswordClientDto) {
    return this.profileService.updatePasswordClient(data);
  }

  @Put('client/company')
  updateCompanyClient(@Body() data: UpdateCompanyClientDto) {
    return this.profileService.updateCompanyClient(data);
  }

  @Put('client/email')
  updateEmailClient(@Body() data: UpdateEmailClientDto) {
    return this.profileService.updateEmailClient(data);
  }

  @Put('client/phone')
  updatePhoneClient(@Body() data: UpdatePhoneClientDto) {
    return this.profileService.updatePhoneClient(data);
  }
  

  @Put('influencer/personal')
  updatePersonalInfluencer(@Body() data: UpdatePersonalInfluencerDto) {
    return this.profileService.updatePersonalInfluencer(data);
  }

  @Put('influencer/music')
  updateMusicStyleInfluencer(@Body() data: UpdateMusicStyleInfluencerDto) {
    return this.profileService.updateMusicStyleInfluencer(data);
  }

  @Put('influencer/email')
  updateEmailInfluencer(@Body() data: UpdateEmailInfluencerDto) {
    return this.profileService.updateEmailInfluencer(data);
  }

  @Put('influencer/phone')
  updatePhoneInfluencer(@Body() data: UpdatePhoneInfluencerDto) {
    return this.profileService.updatePhoneInfluencer(data);
  }
}
