import * as React from 'react';
import { render } from 'react-dom';
import classnames from 'classnames';

import { SVG } from './components/svg';
import { ProgressBar } from './components/progress-bar';

import spinnerIcon from './img/spinner.svg';
import plusIcon from './img/plus.svg';
import checkIcon from './img/check.svg';
import playIcon from './img/play.svg';
import pauseIcon from './img/pause.svg';
import prevIcon from './img/prev.svg';
import nextIcon from './img/next.svg';
import deleteIcon from './img/delete.svg';
import searchIcon from './img/search.svg';

import './styles.css';
import templateState from './data/template-playlist.json';
import { durationDisplay } from './lib/utils';
import { API } from './lib/api';

const savedState = window.localStorage.getItem('tubemusic-songs');
let initialMediaPlayerState = savedState ? JSON.parse(savedState) : templateState;
// Sort songs based on listen count
initialMediaPlayerState.songs.sort((a, b) => (b.listenCount || 0) - (a.listenCount || 0));

const MediaPlayerContext = React.createContext({
  state: initialMediaPlayerState,
  dispatch: null
});
const MediaPlayerStateProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer((state, action) => {
    switch (action.type) {
      case 'LISTEN_COUNT':
      return {
        ...state,
        songs: state.songs.map(song => {
          if (song.id === action.value.id) {
            song.listenCount = (song.listenCount || 0) + 1;
          }
          return song;
        })
      }
      case 'ADD_SONG':
        return {
          ...state,
          songs: state.songs.concat(action.value)
        };
      case 'REMOVE_SONG':
        return {
          ...state,
          songs: state.songs.filter(s => s.id !== action.value)
        };
      case 'PLAY_SONG':
        return {
          ...state,
          player: {
            currentSongIndex: action.value
          }
        };
      case 'STOP_SONG':
        return {
          ...state,
          player: {
            currentSongIndex: -1
          }
        };
      case 'RANDOM_SONG':
        let randomIndex = ~~(Math.random() * (state.songs.length - 1));
        return {
          ...state,
          player: {
            currentSongIndex: randomIndex,
          }
        };
      case 'NEXT_SONG':
        let idx = state.player.currentSongIndex;
        if (idx + 1 <= state.songs.length - 1) {
          idx += 1;
        } else {
          idx = 0;
        }
        return {
          ...state,
          player: {
            currentSongIndex: idx,
          }
        };
      case 'PREV_SONG':
        let pidx = state.player.currentSongIndex;
        if (pidx - 1 >= 0) {
          pidx -= 1;
        } else {
          pidx = state.songs.length - 1;
        }
        return {
          ...state,
          player: {
            currentSongIndex: pidx,
          }
        };
      default:
        throw new Error();
    }
  }, initialMediaPlayerState);

  React.useEffect(() => {
    // Remove the current playing state from saved state
    const stateToSave = {
      ...state,
      player: {
        currentSongIndex: -1,
      }
    };
    window.localStorage.setItem('tubemusic-songs', JSON.stringify(stateToSave));
  }, [ state ]);

  return <MediaPlayerContext.Provider value={{ state, dispatch }}>{children}</MediaPlayerContext.Provider>;
};

const SearchEntries = ({ items }) => {
  const { state, dispatch } = React.useContext(MediaPlayerContext);

  const entryClickHandler = ({ title, id, uploader }) => {
    dispatch({
      type: 'ADD_SONG',
      value: { title, id, uploader, listenCount: 0 }
    });
  };

  const shouldDisabled = (item) => {
    const found = state.songs.find(s => s.id === item.id);
    return found !== undefined;
  };

  return items.map((item, i) => {
    const disabled = shouldDisabled(item);
    return (
      <li
        key={i}
        onClick={() => entryClickHandler(item)}
        className={classnames(
          "group p-3 border-b border-gray-700 flex flex-row cursor-pointer hover:bg-gray-800",
          { "opacity-25 pointer-events-none": disabled }
        )}
      >
        <div className={classnames(
          "w-8 h-8 mr-2 flex items-center justify-center flex-shrink-0",
          { "text-white group-hover:text-green-500": !disabled },
          { "text-gray-600": disabled }
        )}>
          <SVG content={disabled ? checkIcon : plusIcon}/>
        </div>
        <div className="items-center flex-1">
          <div className="font-medium text-white">{item.title}</div>
          <div className="flex flex-row text-sm text-gray-500">
            <div className="flex-1 text-left">{item.uploader}</div>
            <div className="flex-1 font-medium text-right"></div>
          </div>
        </div>
      </li>
    )
  });
};

const SearchArea = () => {
  const searchInputRef = React.useRef<HTMLInputElement>();
  const [loading, setLoading] = React.useState(false);
  const [searchResult, setSearchResult] = React.useState([]);

  const keyPressHandler = async (e) => {
    if (e.key === 'Enter') {
      const query = searchInputRef?.current?.value;
      if (query) {
        setLoading(true);
        const results = await API.search(query);
        setLoading(false);
        setSearchResult(results);
      }
    }
  };

  return (
    <div id="search-area" className="flex flex-col w-3/12 bg-gray-800 border-l border-gray-700 shadow-lg opacity-80">
      <div
        className="flex flex-row items-center flex-shrink-0 px-4 py-2 m-3 text-white bg-gray-600 rounded-full"
      >
        <div className="flex-shrink-0 mr-3">
          <SVG content={searchIcon}/>
        </div>
        <input
          className="flex-1 text-white bg-gray-600 outline-none"
          ref={searchInputRef}
          type="text"
          placeholder="Search by song title or artist..."
          onKeyPress={keyPressHandler}
        />
      </div>
      {loading ? (
        <div className="w-5 h-5 mx-auto my-5 text-white animate-spin">
          <SVG content={spinnerIcon}/>
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden">
          <ul className="absolute top-0 bottom-0 left-0 right-0 overflow-y-scroll" style={{ right: -17 }}>
            <SearchEntries items={searchResult} />
          </ul>
        </div>
      )}
    </div >
  );
};

const MediaPlaylist = () => {
  const { state, dispatch } = React.useContext(MediaPlayerContext);

  const playClickHandler = (index) => {
    dispatch({
      type: 'PLAY_SONG',
      value: index
    });
  };

  const deleteClickHandler = (song) => {
    dispatch({
      type: 'REMOVE_SONG',
      value: song.id
    });
  };

  return (
    <div className="absolute top-0 bottom-0 left-0 right-0 overflow-y-scroll" style={{ right: -17 }}>
      {state.songs.map((song, i) => {
        const isCurrent = state.player?.currentSongIndex === i;
        return (
          <div
            key={i}
            className={classnames(
              "group grid grid-cols-10 border-b border-gray-800 cursor-pointer hover:bg-gray-800",
              "items-center",
              { "text-green-500": isCurrent },
              { "text-gray-300": !isCurrent }
            )}
          >
            <div
              className="flex flex-row items-center p-2 col-span-6"
              onClick={() => playClickHandler(i)}
            >
              <div className="items-center justify-center flex-shrink-0 w-8 h-6 mr-2 text-center text-gray-700">{i + 1}</div>
              <div className="flex-1 hover:text-green-200">{song.title}</div>
            </div>
            <div className="p-2 col-span-2">{song.uploader}</div>
            <div className="p-2 col-span-1"></div>
            <div className="p-2 col-span-1">
              <button
                className={classnames(
                  "w-8 h-8 flex float-right mx-5 items-center justify-center text-white opacity-10 hover:opacity-100 hover:text-red-500",
                )}
                onClick={() => deleteClickHandler(song)}
              >
                <SVG content={deleteIcon}/>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AudioPlayer = () => {
  const { state, dispatch } = React.useContext(MediaPlayerContext);
  const playerRef = React.useRef<HTMLAudioElement>();
  const currentSongRef = React.useRef<any>();
  const [loading, setLoading] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [songProgress, setSongProgress] = React.useState(0);
  const [duration, setDuration] = React.useState({
    current: 0,
    full: 0
  });

  const volumeUpHandler = () => {
    const player = playerRef?.current;
    if (player.volume < 1) {
      player.volume += 0.1;
    }
  }

  const volumeDownHandler = () => {
    const player = playerRef?.current;
    if (player.volume > 0) {
      player.volume -= 0.1;
    }
  }

  const nextSongHandler = () => {
    dispatch({
      type: 'NEXT_SONG'
    });
  }

  const prevSongHandler = () => {
    dispatch({
      type: 'PREV_SONG'
    });
  }

  const randomSongHandler = () => {
    dispatch({
      type: 'RANDOM_SONG'
    });
  }

  const playPauseToggle = () => {
    const player = playerRef.current;
    if (player) {
      if (playing) {
        player.pause();
        setPlaying(false);
      } else {
        player.play();
        setPlaying(true);
      }
    }
  };

  React.useEffect(() => {
    playerRef.current = new Audio();

    playerRef.current.addEventListener('canplay', () => {
      setLoading(false);
      setPlaying(true);
      playerRef.current.play();

      const currentSong = currentSongRef.current;
      if (currentSong) {
        // @ts-ignore
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentSong.title,
          artist: currentSong.uploader,
          artwork: [
            { src: `https://img.youtube.com/vi/${currentSong.id}/0.jpg`, sizes: '480x480', type: 'image/png' }
          ]
        });
      }
    });

    let lastPercent = 0;
    playerRef.current.addEventListener('timeupdate', (e) => {
      const player = playerRef.current;
      let percent = player.currentTime / player.duration * 100;
      setSongProgress(percent);
      setDuration({
        current: player.currentTime,
        full: player.duration
      });
      if (~~percent !== lastPercent) {
        if (percent === 100) {
          document.title = "Tubemusic";
          nextSongHandler();
        }
        lastPercent = ~~percent;
      }
    });

    // @ts-ignore
    navigator.mediaSession.setActionHandler('play', function() {
      const player = playerRef.current;
      player.play();
      setPlaying(true);
    });

    // @ts-ignore
    navigator.mediaSession.setActionHandler('pause', function() {
      const player = playerRef.current;
      player.pause();
      setPlaying(false);
    });

    // @ts-ignore
    navigator.mediaSession.setActionHandler('previoustrack', function() {
      prevSongHandler();
    });

    // @ts-ignore
    navigator.mediaSession.setActionHandler('nexttrack', function() {
      nextSongHandler();
    });
  }, []);

  React.useEffect(() => {
    (async () => {
      if (state.player) {
        const current = state.player.currentSongIndex;
        if (current !== -1) {
          setLoading(true);
          const song = state.songs[current];
          currentSongRef.current = song;
          document.title = song.title;

          if (playing) {
            playerRef.current.pause();
          }

          playerRef.current.src = `/api/stream?id=${song.id}`;
          playerRef.current.load();

          dispatch({
            type: 'LISTEN_COUNT',
            value: song
          })
        }
      }
    })();
  }, [state.player]);

  const songProgressClickHandler = (percent) => {
    if (playing) {
      const player = playerRef.current;
      const duration = player.duration;
      const goTo = parseFloat((duration * percent / 100).toFixed(2));
      player.currentTime = goTo;
    }
  };

  return (
    <div className="flex flex-row items-center flex-1 p-3 bg-gray-800 border-t border-gray-700">
      <button
        className="flex items-center justify-center w-8 h-8 mr-2 text-white bg-gray-600 rounded-full hover:bg-gray-500"
        onClick={prevSongHandler}
      >
        <SVG content={prevIcon}/>
      </button>
      <button
        className="flex items-center justify-center w-12 h-12 mr-2 text-white bg-gray-600 rounded-full hover:bg-gray-500"
        onClick={playPauseToggle}
      >
        <SVG content={playing ? pauseIcon : playIcon}/>
      </button>
      <button
        className="flex items-center justify-center w-8 h-8 mr-2 text-white bg-gray-600 rounded-full hover:bg-gray-500"
        onClick={nextSongHandler}
      >
        <SVG content={nextIcon}/>
      </button>
      {loading ? (
        <div className="flex-1 mx-5 text-sm text-center">
          <div className="w-5 h-5 mx-auto text-white animate-spin">
            <SVG content={spinnerIcon}/>
          </div>
        </div >
      ) : (
        <ProgressBar
          progress={songProgress}
          onClick={songProgressClickHandler}
        />
      )}
      <div className="px-3 font-mono text-sm text-center text-gray-500">{durationDisplay(duration.current)} / {durationDisplay(duration.full)}</div>
    </div>
  );
};

const MediaPlayerArea = () => {
  return (
    <div id="music-player" className="flex flex-col flex-1 max-h-screen">
      <div id="playlist" className="relative flex-1 overflow-hidden">
        <MediaPlaylist/>
      </div>
      <div id="player-control" className="flex h-auto shadow-lg">
        <AudioPlayer/>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <MediaPlayerStateProvider>
      <div
        className="flex flex-row w-screen h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black"
      >
        <div
          className="flex flex-col flex-1 h-screen"
        >
          <MediaPlayerArea />
        </div>
        <SearchArea />
      </div>
    </MediaPlayerStateProvider>
  );
};

render(<App/>, document.querySelector("#app"));
