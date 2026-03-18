import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { errorMessages } from 'src/errors/custom';
import { PayloadDto } from '../dto/auth.dto';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException(errorMessages.auth.invlidToken);
      }

      const bearerToken = authHeader.split(' ')[1];
      const payload: PayloadDto = await this.jwtService.verifyAsync(
        bearerToken,
        {
          secret: this.configService.get<string>('jwt.secret'),
        },
      );

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof TokenExpiredError)
        throw new UnauthorizedException(errorMessages.auth.expiredToken);
      throw new UnauthorizedException(errorMessages.auth.invlidToken);
    }
  }
}
