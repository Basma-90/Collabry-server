import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from '../modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class authGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return false;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return false;
    }
    const decoded = await this.authService.verifyToken(token);
    // console.log(decoded);
    if (!decoded) {
      return false;
    }
    let userId;
    if (typeof decoded !== 'string' && 'userId' in decoded) {
      userId = decoded.userId.toString();
    } else {
      return false;
    }
    const user = await this.authService.getUserById(userId);

    request.user = user;
    return true;
  }
}
