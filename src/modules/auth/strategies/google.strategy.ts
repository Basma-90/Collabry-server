import { PassportStrategy } from "@nestjs/passport";
import { Injectable, Logger } from "@nestjs/common";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: `http://localhost:${configService.get('PORT')}/auth/google/callback`,
      scope: ['email', 'profile', 'openid'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      //this.logger.debug('Google Profile:', profile);
      if (!profile || !profile.emails || !profile.emails[0] || !profile.name) {
        throw new Error('Invalid profile data');
      }

      const { name, emails, photos } = profile;

      const user = {
        firstName: name.givenName,
        lastName: name.familyName,
        email: emails[0].value,
        picture: photos?.[0]?.value || null,
        accessToken,
        refreshToken,
      };

      return done(null, user);
    } catch (error) {
      this.logger.error('Error during Google OAuth validation:', error);
      done(error, null);
    }
  }
}