import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Put,
    Param,
    Delete,
    Query,
    UseInterceptors,
    UploadedFile,
    Res,
} from '@nestjs/common';
import {AdminService} from "./admin.service";
import {AdminUpdatePersonalClientDto} from "./dto/admin-update-client.dto";
import {AdminUpdateInfluencerPersonalDto} from "./dto/admin-update-influencer-personal.dto";
import {AdminUpdateInfluencerInstagramDto} from "./dto/admin-update-influencer-instagram.dto";
import {AdminUpdateInfluencerInvoiceDto} from "./dto/admin-update-influencer-invoice.dto";
import {AdminUpdateClientPayment} from "./dto/admin-update-client-payment.update";
import {AdminUpdatePromoDto} from "./dto/admin-update-promo.dto";
import {AdminUpdatePromoVideoDto} from "./dto/admin-update-promo-video.dto";
import {AdminUpdatePromoInfluencersDto} from "./dto/admin-update-promo-influencers.dto";
import {AdminAddInfluencerToCampaignDto} from "./dto/admin-add-influencer-to-campaign.dto";
import {AdminSendEmailToInfluencerDto} from "./dto/admin-send-email-to-influencer.dto";
import {AdminSaveOffersToTempDto} from "./dto/admin-save-offer-to-temp.dto";
import {AdminPutOfferToOffersDto} from "./dto/admin-put-offer-to-offers.dto";

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {
    }

    @Get('client/getAll')
    adminGetAllClients() {
        return this.adminService.adminGetClients();
    }
    
    @Put('client/update')
    adminUpdateClient(@Body() data: AdminUpdatePersonalClientDto) {
        return this.adminService.adminUpdateClient(data);
    }
    
    @Get('influencer/getAll')
    adminGetAllInfluencerInstaAccounts() {
        return this.adminService.adminGetAllInfluencerInstaAccounts();
    }
    
    @Put('influencer/update/personal')
    adminUpdateInfluencerPersonal(@Body() data: AdminUpdateInfluencerPersonalDto) {
        return this.adminService.adminUpdatePersonalInfluencer(data);
    }
    
    @Put('influencer/update/instagram')
    adminUpdateInfluencerInstagram(@Body() data: AdminUpdateInfluencerInstagramDto) {
        return this.adminService.adminUpdateInfluencerInstagram(data);
    }
    
    @Get('influencer/getOne/:id/:instagramUsername')
    adminGetOneInfluencerInstaAccount(@Param('id') id: string, @Param('instagramUsername') instagramUsername: string) {
        return this.adminService.adminGetOneInfluencerInstaAccount(id, instagramUsername);
    }
    
    @Get('invoices-influencers/getAll')
    adminGetAllInvoices() {
        return this.adminService.adminGetAllInvoices();
    }
    
    @Put('invoices-influencers/update')
    adminUpdateInfluencerInvoice(@Body() data: AdminUpdateInfluencerInvoiceDto) {
        return this.adminService.adminUpdateInfluencerInvoice(data);
    }
    
    @Get('invoices-influencers/getOne/:id')
    adminGetOneInfluencerInvoice(@Param('id') id: string) {
        return this.adminService.adminGetOneInfluencerInvoice(id);
    }
    
    @Get('invoices-clients/getAll')
    adminGetAllClientInvoices() {
        return this.adminService.adminGetAllClientsPayments();
    }
    
    @Put('invoices-clients/update')
    adminUpdateClientInvoice(@Body() data: AdminUpdateClientPayment) {
        return this.adminService.adminUpdateClientPayment(data);
    }
    
    @Get('invoices-clients/getOne/:id')
    adminGetOneClientInvoice(@Param('id') id: string) {
        return this.adminService.adminGetOneClientPayment(id);
    }
    
    @Get('promos/getAll')
    adminGetAllPromos() {
        return this.adminService.adminGetAllPromos();
    }
    
    @Delete('promos/delete/:id')
    adminDeletePromo(@Param('id') id: string) {
        return this.adminService.adminDeletePromo(id);
    }
    
    @Put('promos/close-for-influencer/:promoId/:instagramUsername')
    adminClosePromoForInfluencer(@Param('promoId') promoId: string, @Param('instagramUsername') instagramUsername: string) {
        return this.adminService.adminClosePromoForInfluencer(promoId, instagramUsername);
    }
    
    @Get('promos/getOne/:id')
    adminGetOnePromo(@Param('id') id: string) {
        return this.adminService.adminGetOnePromo(id);
    }
    
    @Put('promos/update')
    adminUpdatePromo(@Body() data: AdminUpdatePromoDto) {
        return this.adminService.adminUpdatePromo(data);
    }
    
    @Post('promos/send-public-link/:userId/:publicLink')
    adminSendCampaignPublicLinkToClient(@Param('userId') userId: string, @Param('publicLink') publicLink: string) {
        return this.adminService.adminSendCampaignPublicLinkToClient(userId, publicLink);
    }
    
    @Post('send-invoice-client')
    adminSendNewInvoiceToClient(@Body() data: any) {
        return this.adminService.adminSendNewInvoiceToClient(data);
    }
    
    @Put('promos/update/video')
    adminUpdatePromoVideo(@Body() data: AdminUpdatePromoVideoDto) {
        return this.adminService.adminUpdatePromoVideo(data);
    }
    
    @Put('promos/update/influencers-list')
    adminUpdateInfluencersListPromo(@Body() data: AdminUpdatePromoInfluencersDto) {
        return this.adminService.adminUpdateInfluencersListPromo(data);
    }
    
    @Put('promos/update/remove-influencer/:promoId/:instagramUsername')
    adminRemoveInfluencerFromPromo(@Param('promoId') promoId: string, @Param('instagramUsername') instagramUsername: string) {
        return this.adminService.adminRemoveInfluencerFromPromo(promoId, instagramUsername);
    }
    
    @Put('promos/update/add-influencer-to-promo')
    adminAddInfluencerToPromo(@Body() data: AdminAddInfluencerToCampaignDto) {
        return this.adminService.adminAddInfluencerToPromo(data);
    }

    @Put('promos/update/add-influencer-to-temp-list/:promoId/:instagramUsername')
    adminAddInfluencerToTempList(@Param('promoId') promoId: string, @Param('instagramUsername') instagramUsername: string) {
        return this.adminService.adminAddInfluencerToTempList(promoId, instagramUsername);
    }
    
    @Post('promos/send-mail-influencer')
    adminSendEmailToInfluencer(@Body() data: AdminSendEmailToInfluencerDto) {
        return this.adminService.adminSendEmailToInfluencer(data);
    }
    
    @Put('promos/give-partial-refund/:userId/:partialRefund/:campaignId')
    adminGivePartialRefundToClient(@Param('userId') userId: string, @Param('partialRefund') partialRefund: number, @Param('campaignId') campaignId: string) {
        return this.adminService.adminGivePartialRefundToClient(userId, partialRefund, campaignId);
    }
    
    @Get('offers/getAll')
    adminGetAllOffers() {
        return this.adminService.adminGetAllOffers();
    }
    
    @Put('offers/delete-and-save-to-temp')
    adminDeleteOfferAndSaveToTemp(@Body() data: AdminSaveOffersToTempDto) {
        return this.adminService.adminDeleteOfferAndSaveToTemp(data);
    }
    
    @Put('offers/save-to-temp')
    adminSaveOffersToTemp(@Body() data: AdminSaveOffersToTempDto) {
        return this.adminService.adminSaveOffersToTemp(data);
    }
    
    @Put('offers/delete-from-temp/:offerId')
    adminDeleteOffer(@Param('offerId') offerId: string) {
        return this.adminService.adminDeleteOffer(offerId);
    }
    
    @Put('offers/return-from-deleted')
    adminReturnOfferFromDeleted(@Body() data: AdminPutOfferToOffersDto) {
        return this.adminService.adminReturnOfferFromDeleted(data);
    }
    
    @Put('offers/publish')
    adminPublishOffers() {
        return this.adminService.adminPublishOffers();
    }
    
    @Put('offers/update')
    adminUpdateOldOffer(@Body() data: AdminSaveOffersToTempDto) {
        return this.adminService.adminUpdateOldOffer(data);
    }
    
    @Put('influencer/hide-instagram/:influencerId/:instagramUsername')
    adminHideInstagramAccount(@Param('influencerId') influencerId: string, @Param('instagramUsername') instagramUsername: string) {
        return this.adminService.adminHideInstagramAccount(influencerId, instagramUsername);
    }
}