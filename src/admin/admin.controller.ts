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
}