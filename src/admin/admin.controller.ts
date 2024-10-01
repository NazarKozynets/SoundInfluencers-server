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
}