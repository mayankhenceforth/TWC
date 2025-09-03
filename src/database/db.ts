import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

export function ConfigureDB() {
    return MongooseModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
            uri: configService.get<string>('MONGODB_URI') || 'mongodb://127.0.0.1:27017/nestdb',
        }),
    });
}
