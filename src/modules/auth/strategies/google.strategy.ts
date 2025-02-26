import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import {Strategy , VerifyCallback} from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy,'google'){
  constructor(private configService: ConfigService , private authService:AuthService){ 
    super({
      clientID:configService.get('GOOGLE_CLIENT_ID'),
      clientSecret:configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL:`http://localhost:${configService.get('PORT')}/auth/google/callback`,
      scope: ['email','profile']
    }) 
  }
  async validate(accessToken:string , refreshToken:string , done:VerifyCallback , profile:any):Promise<any>{
    const {name,emails,photos} = profile;
    const user={
      firstName:name.givenName,
      lastName:name.familyName,
      email:emails[0].value,
      picture:photos[0].value,
      accessToken,
      refreshToken
    }
    done(null,user)
  }
}
