import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { errorMessages } from 'src/errors/custom';
import { PayloadDto } from '../dto/auth.dto';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoleIds = this.reflector.get<number[]>(
      'roleIds',
      context.getHandler(),
    );
    if (!requiredRoleIds || requiredRoleIds.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: PayloadDto = request.user;

    if (!user || !user.roleIds || user.roleIds.length === 0) {
      throw new UnauthorizedException(errorMessages.auth.notAllowed);
    }

    const hasRequiredRole = user.roleIds.some((userRoleId) =>
      requiredRoleIds.includes(userRoleId),
    );

    if (!hasRequiredRole) {
      throw new UnauthorizedException(errorMessages.auth.notAllowed);
    }

    return true;
  }
}
