import 'regenerator-runtime/runtime';
import * as React from 'react';
import { render } from 'react-dom';
import axios from 'axios';
import classnames from 'classnames';

import { SVG } from './components/svg';

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

const savedState = window.localStorage.getItem('tubemusic-songs');
const initialMediaPlayerState = savedState ? JSON.parse(savedState) : templateState;

const MediaPlayerContext = React.createContext({
  state: initialMediaPlayerState,
  dispatch: null
});
const MediaPlayerStateProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer((state, action) => {
    switch (action.type) {
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


const pad = n => (n > 9 ? `${n}` : `0${n}`);
const durationDisplay = counter => {
  const days = ~~(counter / 86400);
  const remain = counter - days * 86400;
  const hrs = ~~(remain / 3600);
  const min = ~~((remain - hrs * 3600) / 60);
  const sec = ~~(remain % 60);
  return `${hrs > 0 ? pad(hrs) + ':' : ''}${pad(min)}:${pad(sec)}`;
};

const API = {
  search: async (query) => {
    const result = await axios.get(`/api/search?query=${query}&limit=10`);
    return result?.data;
  },
  getUrl: async (song) => {
    const result = await axios.get(`/api/play?id=${song}`);
    return result?.data;
  }
};

const SearchEntries = ({ items }) => {
  const { state, dispatch } = React.useContext(MediaPlayerContext);

  const entryClickHandler = ({ title, id, uploader }) => {
    dispatch({
      type: 'ADD_SONG',
      value: { title, id, uploader }
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
        <div className="flex-1 items-center">
          <div className="font-medium text-white">{item.title}</div>
          <div className="flex flex-row text-sm text-gray-500">
            <div className="flex-1 text-left">{item.uploader}</div>
            <div className="flex-1 text-right font-medium"></div>
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
    <div id="search-area" className="w-3/12 border-l border-gray-700 bg-gray-800 opacity-80 flex flex-col shadow-lg">
      <div
        className="px-4 py-2 items-center bg-gray-600 rounded-full m-3 flex-shrink-0 text-white flex flex-row"
      >
        <div className="flex-shrink-0 mr-3">
          <SVG content={searchIcon}/>
        </div>
        <input
          className="flex-1 outline-none bg-gray-600 text-white"
          ref={searchInputRef}
          type="text"
          placeholder="Search by song title or artist..."
          onKeyPress={keyPressHandler}
        />
      </div>
      {loading ? (
        <div className="animate-spin my-5 mx-auto h-5 w-5 text-white">
          <SVG content={spinnerIcon}/>
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden">
          <ul className="absolute top-0 left-0 bottom-0 right-0 overflow-y-scroll" style={{ right: -17 }}>
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
    <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-0" style={{ right: -17 }}>
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
              className="p-2 col-span-6 flex flex-row items-center"
              onClick={() => playClickHandler(i)}
            >
              <div className="flex-shrink-0 mr-2 w-8 h-6 text-center items-center justify-center text-gray-700">{i + 1}</div>
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
        console.log("DBG::LAST PERCENT", lastPercent);
        if (percent === 100) {
          document.title = "Tubemusic";
          nextSongHandler();
        }
        lastPercent = ~~percent;
      }
    });
  }, []);

  React.useEffect(() => {
    (async () => {
      if (state.player) {
        const current = state.player.currentSongIndex;
        if (current !== -1) {
          setLoading(true);
          const song = state.songs[current];
          document.title = song.title;

          if (playing) {
            playerRef.current.pause();
          }

          const source = await API.getUrl(song.id);
          playerRef.current.src = source.url;
          playerRef.current.load();
        }
      }
    })();
  }, [state.player]);

  return (
    <div className="p-3 flex-1 flex flex-row items-center bg-gray-800 border-t border-gray-700">
      <button
        className="w-8 h-8 rounded-full mr-2 flex items-center justify-center text-white bg-gray-600 hover:bg-gray-500"
        onClick={prevSongHandler}
      >
        <SVG content={prevIcon}/>
      </button>
      <button
        className="w-12 h-12 rounded-full mr-2 flex items-center justify-center text-white bg-gray-600 hover:bg-gray-500"
        onClick={playPauseToggle}
      >
        <SVG content={playing ? pauseIcon : playIcon}/>
      </button>
      <button
        className="w-8 h-8 rounded-full mr-2 flex items-center justify-center text-white bg-gray-600 hover:bg-gray-500"
        onClick={nextSongHandler}
      >
        <SVG content={nextIcon}/>
      </button>
      {loading ? (
        <div className="flex-1 mx-5 text-center text-sm">
          <div className="animate-spin mx-auto h-5 w-5 text-white">
            <SVG content={spinnerIcon}/>
          </div>
        </div >
      ) : (
        <div className="flex-1 h-2 rounded-lg border border-gray-500 mx-5">
          <div className="h-full bg-gray-300" style={{ width: `${songProgress}%` }}></div>
        </div >
      )}
      <div className="px-3 text-center text-sm text-gray-500 font-mono">{durationDisplay(duration.current)} / {durationDisplay(duration.full)}</div>
    </div>
  );
};

const MediaPlayerArea = () => {
  return (
    <div id="music-player" className="max-h-screen flex-1 flex flex-col">
      <div id="playlist" className="flex-1 overflow-hidden relative">
        <MediaPlaylist/>
      </div>
      <div id="player-control" className="h-auto flex shadow-lg">
        <AudioPlayer/>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <MediaPlayerStateProvider>
      <div
        className="w-screen h-screen flex flex-row bg-gradient-to-br from-gray-900 via-gray-800 to-black"
      >
        <div
          className="flex-1 h-screen flex flex-col"
        >
          <MediaPlayerArea />
        </div>
        <SearchArea />
      </div>
    </MediaPlayerStateProvider>
  );
};

render(<App/>, document.querySelector("#app"));