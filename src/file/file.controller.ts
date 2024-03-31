import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { createWriteStream, readFile, readFileSync } from 'fs';
import { ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import sizeOf from 'image-size';

@Controller('file')
export class FileController {
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file) {
    try {
      if (file && file.filename) {
        const data = readFileSync(file.path);
        const dimensions = sizeOf(data);
        if (dimensions.width && dimensions.height) {
          const writeStream = createWriteStream(`./uploads/${file.filename}`);
          writeStream.write(data);
          writeStream.end();

          return {
            code: 201,
            path: `http://localhost:3000/uploads/${file.filename}`,
          };
        } else {
          return {
            code: 500,
            message: 'is not image',
          };
        }
      } else {
        return {
          code: 500,
          message: 'error image',
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
