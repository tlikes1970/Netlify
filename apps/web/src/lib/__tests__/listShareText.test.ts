import { expect, it } from 'vitest';
import { formatListShareText, getFlickletShareStamp } from '../shareLinks';
it('includes list, public ratings and footer but never personal ratings',()=>{const text=formatListShareText('Summer Picks',[{title:'Dune',mediaType:'movie',voteAverage:8.1},{title:'Severance',mediaType:'tv',userRating:5}]);expect(text).toContain('📋 Summer Picks');expect(text).toContain('🎬 Dune ⭐ TMDB 8.1/10');expect(text).toContain('📺 Severance\n');expect(text).not.toContain('5.0');expect(text).toContain(getFlickletShareStamp());});
it('empty custom list remains a valid text snapshot',()=>{expect(formatListShareText('Empty',[])).toContain('📋 Empty');expect(formatListShareText('Empty',[])).toContain(getFlickletShareStamp());});
