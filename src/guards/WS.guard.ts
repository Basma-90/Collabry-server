import { Injectable, ExecutionContext, CanActivate, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from '../modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { Socket } from "socket.io";
@Injectable()
export class authGuardSocket implements CanActivate {
    constructor(
        private authService: AuthService,
        private jwtService: JwtService,
    ) { }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient<Socket>();
        const token = client.handshake.auth.token;
        if (!token) {
            throw new UnauthorizedException('Token not provided');
        }
        try {

            const decoded = await this.authService.verifyToken(token);
            if (!decoded) {
                throw new UnauthorizedException('Invalid token');
            }
            let userId;
            if (typeof decoded !== 'string' && 'userId' in decoded) {
                userId = decoded.userId.toString();
            } else {
                throw new UnauthorizedException('Invalid token payload');
            }
            const user = await this.authService.getUserById(userId);
            if (!user) {
                throw new UnauthorizedException('User not found');
            }
            client.data.user = user;
            return true;
        }
        catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}