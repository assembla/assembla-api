'use strict';

import Search from './entities/search';

function searcher(parent) {
  let search = new Search(parent);
  return options => search.params(options).read();
}

export default searcher;
