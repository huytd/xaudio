import 'regenerator-runtime/runtime';
import * as React from 'react';
import { render } from 'react-dom';
import axios from 'axios';
import classnames from 'classnames';
import './styles.css';

// TODO:
// - Sort playlist by drag and drop or by name

const spinnerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-refresh-cw"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;
const plusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const checkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const playIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-play"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const pauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-pause"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>;
const prevIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-skip-back"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>;
const nextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-skip-forward"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>;
const deleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const searchIcon = () => <svg width="20" height="20" fill="none"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>;

const templateState = {
  "songs": [
    {
      "duration": 233,
      "id": "CulBRA4HFgk",
      "title": "Đỉnh của đỉnh - Rhymastic, JustaTee, Wowy, Karik, Binz, Suboi lần đầu kết hợp | Theme Song RAP VIỆT",
      "uploader": "Vie Channel - HTV2 [ SIÊU TRÍ TUỆ Mùa 2 Official ]"
    },
    {
      "duration": 624,
      "id": "4ahl6J3zhWA",
      "title": "Karik, G.Ducky, Ricky Star tạo một cuộc địa chấn bằng bản rap Ala Ela | RAP VIỆT [Live Stage]",
      "uploader": "Vie Channel - HTV2 [ SIÊU TRÍ TUỆ Mùa 2 Official ]"
    },
    {
      "duration": 386,
      "id": "tAGnKpE4NCI",
      "title": "Metallica: Nothing Else Matters (Official Music Video)",
      "uploader": "Metallica"
    },
    {
      "duration": 331,
      "id": "CD-E-LDc384",
      "title": "Metallica: Enter Sandman (Official Music Video)",
      "uploader": "Metallica"
    },
    {
      "duration": 384,
      "id": "Ckom3gf57Yw",
      "title": "Metallica - The Unforgiven (Official Music Video)",
      "uploader": "Warner Records Vault"
    },
    {
      "duration": 465,
      "id": "WM8bTdBs-cw",
      "title": "Metallica: One (Official Music Video)",
      "uploader": "Metallica"
    },
    {
      "duration": 279,
      "id": "RDN4awrpPQQ",
      "title": "Metallica: The Memory Remains (Official Music Video)",
      "uploader": "Metallica"
    },
    {
      "duration": 392,
      "id": "JFAcOnhcpGA",
      "title": "Metallica: Atlas, Rise! (Official Music Video)",
      "uploader": "Metallica"
    },
    {
      "duration": 297,
      "id": "KKc_RMln5UY",
      "title": "Đen - Lối Nhỏ ft. Phương Anh Đào (M/V)",
      "uploader": "Đen Vâu Official"
    },
    {
      "duration": 274,
      "id": "ddaEtFOsFeM",
      "title": "Đen ft. MIN - Bài Này Chill Phết (M/V)",
      "uploader": "Đen Vâu Official"
    },
    {
      "duration": 241,
      "id": "5e7e_KZINA4",
      "title": "Đen - Đưa Nhau Đi Trốn ft. Linh Cáo (Prod. by Suicidal illness) [M/V]",
      "uploader": "Đen Vâu Official"
    },
    {
      "duration": 223,
      "id": "iQBYrTjtBOE",
      "title": "Đen - Lộn Xộn ll",
      "uploader": "Đen Vâu Official"
    },
    {
      "duration": 236,
      "id": "kAydgevIafg",
      "title": "Lộn Xộn lyric- Đen",
      "uploader": "cái gì cũng có"
    },
    {
      "duration": 370,
      "id": "Id76JABvGs4",
      "title": "Nah - Bất Động (Featuring MAC, Lynk Lee, Binz and CleverStar)",
      "uploader": "deadnah"
    },
    {
      "duration": 151,
      "id": "UEqxDuK7FrI",
      "title": "Bụi Đường - JustaTee ft Mr A & Mr T",
      "uploader": "VCLproduction"
    },
    {
      "duration": 259,
      "id": "Y9NpOCWcz8E",
      "title": "[ VIDEO LYRICS ] Tuyết yêu thương - Young Uno",
      "uploader": "Tuấn Vũ"
    },
    {
      "duration": 224,
      "id": "jgZkrA8E5do",
      "title": "TOULIVER x BINZ - \"BIGCITYBOI\" (Official Music Video)",
      "uploader": "Binz Da Poet"
    },
    {
      "duration": 284,
      "id": "XdK-PdEdkaU",
      "title": "[Official MV] Xin Anh Đừng - Emily ft. Lil' Knight & JustaTee",
      "uploader": "JustaTeeMusic"
    },
    {
      "duration": 290,
      "id": "SFfBV-LBdC4",
      "title": "NGỌN NẾN TRƯỚC GIÓ - EMILY ft LK,JUSTATEE,ANDREE",
      "uploader": "BIGDADDY x EMILY"
    },
    {
      "duration": 272,
      "id": "4RgCllKvJuc",
      "title": "Bức Tường - Những Chuyến Đi Dài (Official Music Video)",
      "uploader": "BAN NHẠC BỨC TƯỜNG"
    },
    {
      "duration": 5384,
      "id": "8ewBoV-8oLA",
      "title": "Đất Việt Những Ca Khúc Hay Nhất Của Bức Tường 2015",
      "uploader": "Ayala Ashley"
    },
    {
      "duration": 2706,
      "id": "au7mEGplIUo",
      "title": "Album - Tâm hồn của đá - Bức tường",
      "uploader": "MrHienNq"
    },
    {
      "duration": 305,
      "id": "M8687KWCIjg",
      "title": "Bức Tường - Ngày khác",
      "uploader": "ndtung90"
    },
    {
      "duration": 244,
      "id": "ONfVqtNCUQE",
      "title": "01 - Bay 2 - Microwave [Album 10]",
      "uploader": "ROCK STORM"
    },
    {
      "duration": 315,
      "id": "nhv0G1vFLlI",
      "title": "08 - Nhớ - Microwave [Album 10]",
      "uploader": "ROCK STORM"
    },
    {
      "duration": 229,
      "id": "nDtOoosgmWk",
      "title": "04 - Say - Microwave [Album 10]",
      "uploader": "ROCK STORM"
    },
    {
      "duration": 246,
      "id": "DaLEzJeQACU",
      "title": "03 - Phai - Microwave [Album 10]",
      "uploader": "ROCK STORM"
    },
    {
      "duration": 309,
      "id": "peDZ6THxUnU",
      "title": "06 - Quên - Microwave [Album 10]",
      "uploader": "ROCK STORM"
    },
    {
      "duration": 239,
      "id": "2kgET0iolaM",
      "title": "05 - Đừng - Microwave [Album 10]",
      "uploader": "ROCK STORM"
    },
    {
      "duration": 347,
      "id": "FrR_Ugq_hRk",
      "title": "Rosewood - Âm thanh thời gian - official MV",
      "uploader": "Ha Vu"
    },
    {
      "duration": 417,
      "id": "KloZvQvSYBM",
      "title": "Một Điều Là Mãi Mãi - Rosewood",
      "uploader": "quang nguyen"
    },
    {
      "duration": 371,
      "id": "QIfBYeQjTks",
      "title": "CHA - MTV, Karik, Võ Trọng Phúc, Ngô Duy Khiêm, Nguyễn Quân, The Zoo [ MTVband ]",
      "uploader": "MTV Band"
    },
    {
      "duration": 203,
      "id": "lYUYLqkNqDk",
      "title": "Hydra - Người cha câm - Team Karik | RAP VIỆT [MV Lyrics]",
      "uploader": "Vie Channel - HTV2 [ RAP VIỆT Official ]"
    },
    {
      "duration": 262,
      "id": "Mt8VnhbbIVc",
      "title": "YC - Tượng (Official Audio)",
      "uploader": "Rhymastic Official"
    },
    {
      "duration": 306,
      "id": "R43xOUlRHWc",
      "title": "Tạ Quang Thắng - Vội Vàng (Official Music Video)",
      "uploader": "Tạ Quang Thắng"
    },
    {
      "duration": 330,
      "id": "vXOn2pfhCbU",
      "title": "Tạ Quang Thắng - Đâu Phải Là Mơ (Official Music Video)",
      "uploader": "Tạ Quang Thắng"
    },
    {
      "duration": 397,
      "id": "F668R2cwesk",
      "title": "Tạ Quang Thắng - Duyên (Musical Short Film)",
      "uploader": "Tạ Quang Thắng"
    },
    {
      "duration": 320,
      "id": "MsuzMwWGBrY",
      "title": "Lá Cờ - Tạ Quang Thắng | Điều Nhỏ Xíu Xiu MV Lyrics",
      "uploader": "Điều Nhỏ Xíu Xiu"
    },
    {
      "duration": 387,
      "id": "1nB13jFuc2s",
      "title": "Tạ Quang Thắng - Viết Tình Ca (Official Video)",
      "uploader": "Tạ Quang Thắng"
    },
    {
      "duration": 274,
      "id": "AdfSLq7XNoI",
      "title": "MIN from ST.319 - TÌM (LOST) (ft. MR.A) M/V",
      "uploader": "ST.319 Entertainment"
    },
    {
      "duration": 294,
      "id": "0R8IbpKXavM",
      "title": "MIN - ‘TRÊN TÌNH BẠN DƯỚI TÌNH YÊU’ OFFICIAL MUSIC VIDEO",
      "uploader": "MIN OFFICIAL"
    },
    {
      "duration": 285,
      "id": "qGb7H6aN32I",
      "title": "MIN from ST.319 - Y.Ê.U (Acoustic Ver.) M/V",
      "uploader": "ST.319 Entertainment"
    },
    {
      "duration": 242,
      "id": "EWz4fITO5qg",
      "title": "MIN x ĐEN x JUSTATEE - VÌ YÊU CỨ ĐÂM ĐẦU (VYCĐĐ) | OFFICIAL MUSIC VIDEO (민)",
      "uploader": "MIN OFFICIAL"
    }
  ],
  "player": {
    "currentSongIndex": -1
  }
};

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
        if (idx + 1 < state.songs.length - 1) {
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

  const entryClickHandler = ({ title, id, uploader, duration }) => {
    dispatch({
      type: 'ADD_SONG',
      value: { title, id, uploader, duration }
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
          {disabled ? checkIcon() : plusIcon()}
        </div>
        <div className="flex-1 items-center">
          <div className="font-medium text-white">{item.title}</div>
          <div className="flex flex-row text-sm text-gray-500">
            <div className="flex-1 text-left">{item.uploader}</div>
            <div className="flex-1 text-right font-medium">{durationDisplay(item.duration)}</div>
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
          {searchIcon()}
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
          {spinnerIcon()}
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
            <div className="p-2 col-span-1">{durationDisplay(song.duration)}</div>
            <div className="p-2 col-span-1">
              <button
                className={classnames(
                  "w-8 h-8 flex float-right mx-5 items-center justify-center text-white opacity-10 hover:opacity-100 hover:text-red-500",
                )}
                onClick={() => deleteClickHandler(song)}
              >
                {deleteIcon()}
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
  }, []);

  React.useEffect(() => {
    (async () => {
      if (state.player) {
        const current = state.player.currentSongIndex;
        if (current !== -1) {
          setLoading(true);
          const song = state.songs[current];

          if (playing) {
            playerRef.current.pause();
          }

          const source = await API.getUrl(song.id);
          playerRef.current.src = source.url;
          playerRef.current.load();

          playerRef.current.addEventListener('canplay', () => {
            setLoading(false);
            document.title = song.title;
            setPlaying(true);
            playerRef.current.play();
          });

          playerRef.current.addEventListener('timeupdate', (e) => {
            const player = playerRef.current;
            let percent = ~~(player.currentTime / player.duration * 100);
            setSongProgress(percent);
            setDuration({
              current: player.currentTime,
              full: player.duration
            });
            if (percent >= 100) {
              document.title = "Tubemusic";
              nextSongHandler();
            }
          });
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
        {prevIcon()}
      </button>
      <button
        className="w-12 h-12 rounded-full mr-2 flex items-center justify-center text-white bg-gray-600 hover:bg-gray-500"
        onClick={playPauseToggle}
      >
        {playing ? pauseIcon() : playIcon()}
      </button>
      <button
        className="w-8 h-8 rounded-full mr-2 flex items-center justify-center text-white bg-gray-600 hover:bg-gray-500"
        onClick={nextSongHandler}
      >
        {nextIcon()}
      </button>
      {loading ? (
        <div className="flex-1 mx-5 text-center text-sm">
          <div className="animate-spin mx-auto h-5 w-5 text-white">
            {spinnerIcon()}
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