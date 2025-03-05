import { CallHandler,ExecutionContext,Injectable,NestInterceptor } from '@nestjs/common';
import { map,Observable } from 'rxjs';

@Injectable()
export class TransformBookmarkInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((bookmarks) =>
        bookmarks.map((bookmark) => ({
          id: bookmark.id,
          publication: {
            id: bookmark.publication.id,
            title: bookmark.publication.title,
            abstract: bookmark.publication.abstract,
            language: bookmark.publication.language,
            keywords: bookmark.publication.keywords,
            author: {
              name: bookmark.publication.author.name,
              email: bookmark.publication.author.email,
              profile: {
                bio: bookmark.publication.author.profile?.bio,
                profileImageUrl: bookmark.publication.author.profile?.profileImageUrl,
                profileImagePublicId: bookmark.publication.author.profile?.profileImagePublicId,
              },
            },
          },
        }))
      )
    );
  }
}