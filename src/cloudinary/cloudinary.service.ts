import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from "cloudinary"
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      api_key: this.configService.get("CLOUDINARY_API_KEY"),
      cloud_name: this.configService.get("CLOUDINARY_CLOUD_NAME"),
      api_secret: this.configService.get("CLOUDINARY_API_SECRET")
    })
  }

  async uploadFile(file: Express.Multer.File, folder: string, resourceType: 'image' | 'video' = 'image'): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: file.originalname.replace(/\.[^/.]+$/, "")
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as any);
        }
      );
      Readable.from(file.buffer).pipe(upload);
    });
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'video' = 'image') {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }
}

