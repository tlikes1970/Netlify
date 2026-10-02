import {fireEvent,render,screen} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import {TitlePoster} from '../TitlePoster';
import {POSTER_PLACEHOLDER} from '../../../lib/posterPlaceholder';
vi.mock('../../../lib/language',()=>({useTranslations:()=>({viewTitleOnTmdb:'View {title} on TMDB'})}));
const item={id:'17',mediaType:'tv' as const,title:'Poster title'};
it('missing poster uses the common fallback with the exact research destination',()=>{
 render(<TitlePoster item={item}/>);
 expect(screen.getByRole('img')).toHaveAttribute('src',POSTER_PLACEHOLDER);
 expect(screen.getByRole('link')).toHaveAttribute('href','https://www.themoviedb.org/tv/17');
});
it('broken artwork falls back without losing its research link',()=>{
 render(<TitlePoster item={{...item,posterUrl:'https://image.tmdb.org/t/p/w342/broken.jpg'}}/>);
 fireEvent.error(screen.getByRole('img'));fireEvent.error(screen.getByRole('img'));
 expect(screen.getByRole('img')).toHaveAttribute('src',POSTER_PLACEHOLDER);
 expect(screen.getByRole('link')).toHaveAttribute('href','https://www.themoviedb.org/tv/17');
});
it('changing artwork resets the image instance after a failure',()=>{
 const {rerender}=render(<TitlePoster item={{...item,posterUrl:'https://image.tmdb.org/t/p/w342/broken.jpg'}}/>);
 fireEvent.error(screen.getByRole('img'));fireEvent.error(screen.getByRole('img'));
 rerender(<TitlePoster item={{...item,posterUrl:'https://image.tmdb.org/t/p/w342/new.jpg'}}/>);
 expect(screen.getByRole('img').getAttribute('src')).toContain('new.jpg');
});
it('invalid identity leaves a fallback without inventing a link',()=>{
 render(<TitlePoster item={{...item,id:'invalid'}}/>);
 expect(screen.queryByRole('link')).toBeNull();expect(screen.getByRole('img')).toHaveAttribute('src',POSTER_PLACEHOLDER);
});
