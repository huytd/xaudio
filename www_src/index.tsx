import './styles.css';
import * as React from 'react';
import {render} from 'react-dom';

import {MediaPlayerStateProvider} from './context';
import {AudioPlayer} from './components/audio-player';

import { NowPlayingPage } from './pages/now-playing';

const App = () => {
  return (
    <MediaPlayerStateProvider>
      <div className="flex flex-col w-screen h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
        <NowPlayingPage />
        <div className="h-32 md:h-24 flex">
          <AudioPlayer />
        </div>
      </div>
    </MediaPlayerStateProvider>
  );
};

render(<App />, document.querySelector('#app'));
