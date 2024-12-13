import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Put,
    Param,
    Delete, Query,
} from '@nestjs/common';
import {ProfileService} from './profile.service';
import {UpdatePersonalClientDto} from './dto/update-personal-client.dto';
import {UpdatePasswordClientDto} from './dto/update-password.dto';
import {UpdatePersonalInfluencerDto} from './dto/update-personal-influencer.dto';
import {UpdateSocialMediaAccountDto} from "./dto/update-social-media-account.dto";
import {AddSocialMediasDto} from "./dto/add-social-medias.dto";
import {SendMailPriceChangeDto} from "./dto/send-mail-price-change.dto";
import {ApiQuery} from "@nestjs/swagger";

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {
    }

    @Put('client/personal')
    updatePersonalClient(@Body() data: UpdatePersonalClientDto) {
        return this.profileService.updatePersonalClient(data);
    }

    @Put('client/password')
    updatePasswordClient(@Body() data: UpdatePasswordClientDto) {
        return this.profileService.updatePasswordClient(data);
    }

    @Put('influencer/personal')
    updatePersonalInfluencer(@Body() data: UpdatePersonalInfluencerDto) {
        return this.profileService.updatePersonalInfluencer(data);
    }

    @Put('influencer/update-social-media-account')
    updateSocialMediaAccount(@Body() data: UpdateSocialMediaAccountDto) {
        return this.profileService.updateSocialMediaAccount(data);
    }

    @Patch('influencer/delete-social-media-account')
    deleteSocialMediaAccount(@Body() data: any) {
        return this.profileService.deleteSocialMediaAccount(data);
    }

    @Patch('influencer/add-social-media-accounts')
    addSocialMediaAccounts(@Body() data: AddSocialMediasDto) {
        return this.profileService.addSocialMediaAccounts(data);
    }

    @Post('influencer/send-mail-price-change')
    sendMailAboutChangingPrice(@Body() data: SendMailPriceChangeDto) {
        return this.profileService.sendMailAboutChangingPrice(data);
    }

    @ApiQuery({ name: 'influencerId' })
    @ApiQuery({ name: 'accounts' })
    @ApiQuery({ name: 'isVerified' })
    @Get('influencer/verify-new-brand')
    verifyNewSocialMediaAccounts(
        @Query() query: { influencerId: string; accounts: []; isVerified: boolean },
    ) {
        return this.profileService.verifyNewSocialMediaAccounts(
            query.influencerId,
            query.accounts,
            query.isVerified,
        );
    }


}
