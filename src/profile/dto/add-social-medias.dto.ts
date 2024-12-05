import {Prop} from "@nestjs/mongoose";
import {ISocial} from "../../auth/dto/create-influencer.dto";
import {typesSocialMedia} from "../../auth/dto/create-influencer.dto";
import {ApiProperty} from "@nestjs/swagger";


export class AddSocialMediasDto {
    @ApiProperty()
    influencerId: string;

    @ApiProperty({
        type: 'array',
        items: {type: 'object', properties: typesSocialMedia},
    })
    instagram: ISocial[];
    
    @ApiProperty({
        type: 'array',
        items: {type: 'object', properties: typesSocialMedia},
    })
    tiktok: ISocial[];
    
    @ApiProperty({
        type: 'array',
        items: {type: 'object', properties: typesSocialMedia},
    })
    soundcloud: ISocial[];
    
    @ApiProperty({
        type: 'array',
        items: {type: 'object', properties: typesSocialMedia},
    })
    facebook: ISocial[];
    
    @ApiProperty({
        type: 'array',
        items: {type: 'object', properties: typesSocialMedia},
    })
    youtube: ISocial[];
    
    @ApiProperty({
        type: 'array',
        items: {type: 'object', properties: typesSocialMedia},
    })
    spotify: ISocial[];
    
    @ApiProperty({
        type: 'array',
        items: {type: 'object', properties: typesSocialMedia},
    })
    press: ISocial[];
}