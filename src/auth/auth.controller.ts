import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import {AuthService} from './auth.service';
import {CreateClientDto} from './dto/create-client.dto';
import {CreateInfluencerDto} from './dto/create-influencer.dto';
import {LoginClientDto} from './dto/login-client.dto';
import {VerifyDto} from './dto/verify.dto';
import {ApiProperty, ApiQuery} from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

    @Post('create/client')
    createClient(@Body() data: CreateClientDto) {
        return this.authService.createClient(data);
    }

    @Post('create/influencer')
    createInfluencer(@Body() data: CreateInfluencerDto) {
        return this.authService.createInfluencer(data);
    }

    @ApiQuery({name: 'verifyId'})
    @ApiQuery({name: 'responseVerify'})
    @Get('verify-influencer')
    verifyAdminInfluencer(
        @Query() args: { verifyId: string; responseVerify: string },
    ) {
        return this.authService.verifyAdminInfluencer(
            args.verifyId,
            args.responseVerify,
        );
    }

    @ApiQuery({name: 'verifyId'})
    @ApiQuery({name: 'responseVerify'})
    @Get('verify-client')
    verifyAdminClient(
        @Query() args: { verifyId: string; responseVerify: string },
    ) {
        return this.authService.verifyAdminClient(
            args.verifyId,
            args.responseVerify,
        );
    }

    @Post('login/client')
    loginClient(@Body() data: LoginClientDto) {
        return this.authService.loginClient(data);
    }

    @Post('login/influencer')
    loginInfluencer(@Body() data: LoginClientDto) {
        return this.authService.loginInfluencer(data);
    }

    @Post('verify')
    verify(@Body() data: VerifyDto) {
        return this.authService.verify(data);
    }

    @Get('influencers')
    getInfluencers() {
        return this.authService.getInfluencers();
    }

    @Get('clients')
    getClients() {
        return this.authService.getClients();
    }

    @Get('influencer/:id')
    getInfluencer(@Param('id') id: string) {
        return this.authService.getInfluencerById(id);
    }
    
    @Get('client/:id')
    getClient(@Param('id') id: string) {
        return this.authService.getClientById(id);
    }
}
