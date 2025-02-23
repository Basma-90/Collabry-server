import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export class TokenSender {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  public sendToken(id: string) {
    const accessToken = this.jwt.sign(
      {
        id,
      },
      {
        secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwt.sign(
      {
        id,
      },
      {
        secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: '7d',
      },
    );
    return { accessToken, refreshToken };
  }
}
