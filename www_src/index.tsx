import './styles.css';
import * as React from 'react';
import {render} from 'react-dom';

import {MediaPlayerStateProvider} from './MediaPlayerState';
import {AudioPlayer} from './components/audio-player';
import {MediaPlaylist} from './components/media-playlist';
import {SearchArea} from './components/search-area';

const App = () => {
  return (
    <MediaPlayerStateProvider>
      <div className="flex flex-col w-screen h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="relative flex flex-row flex-1 overflow-hidden">
          <MediaPlaylist />
        </div>
        <div className="h-22 flex">
          <AudioPlayer />
        </div>
      </div>
    </MediaPlayerStateProvider>
  );
};

render(<App />, document.querySelector('#app'));
