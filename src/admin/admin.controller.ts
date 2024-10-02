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
}