import './styles.css';
import * as React from 'react';
import {Fragment} from 'react';
import {render} from 'react-dom';

import {MediaPlayerStateProvider} from './context';
import {AudioPlayer} from './components/audio-player';
import {MediaPlaylist} from './components/media-playlist';
import {SearchArea} from './components/search-area';
import {SVG} from '~/components/svg';

import searchIcon from '~/img/search.svg';
import closeIcon from '~/img/delete.svg';

const App = () => {
  const [showSearch, setShowSearch] = React.useState(false);

  const toggleSearchHandler = () => {
    setShowSearch(!showSearch);
  };

  return (
    <MediaPlayerStateProvider>
      <div className="flex flex-col w-screen h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className={"flex-1 flex flex-row"}>
          {/* Playlist */}
          <div className="relative flex flex-row flex-1 pl-2 overflow-hidden">
            <MediaPlaylist />
            <button
              className={"text-white opacity-50 hover:opacity-100 flex flex-row items-center absolute top-0 right-0 m-5 focus:outline-none"}
              onClick={toggleSearchHandler}
            >
              {!showSearch ? (
                <Fragment>
                  <SVG content={searchIcon} className={'mr-2'} />
                  <span className={"hidden md:block"}>Search</span>
                </Fragment>
              ) : null}
            </button>
          </div>
          {showSearch && <SearchArea toggleSearchHandler={toggleSearchHandler} />}
        </div>
        <div className="h-32 md:h-24 flex">
          <AudioPlayer />
        </div>
      </div>
    </MediaPlayerStateProvider>
  );
};

render(<App />, document.querySelector('#app'));
