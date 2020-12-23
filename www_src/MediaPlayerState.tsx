import * as React from 'react';
import templateState from '~/data/template-playlist.json';

export interface SongState {
  id: string;
  title: string;
  uploader: string;
  listenCount?: number;
}

interface MediaPlayerState {
  songs: SongState[];
  player: {
    currentSongId?: string;
  };
  setting?: {
    isRepeating?: boolean;
    isRandom?: boolean;
  };
}
interface Action {
  type: string;
  value?: any;
}

type ContextProps = {
  state: MediaPlayerState;
  dispatch: React.Dispatch<any>;
};

const savedState = window.localStorage.getItem('tubemusic-songs');
const initialMediaPlayerState = savedState ? JSON.parse(savedState) : templateState;

export const MediaPlayerContext = React.createContext<ContextProps>({
  state: initialMediaPlayerState,
  dispatch: null
});
export const MediaPlayerStateProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer((state: MediaPlayerState, action: Action) => {
    switch (action.type) {
      case 'SORT_PLAYLIST':
        return {
          ...state,
          songs: action.value
        };
      case 'ADD_SONG':
        return {
          ...state,
          songs: state.songs.concat(action.value)
        };
      case 'REMOVE_SONG':
        return {
          ...state,
          songs: state.songs.filter((s) => s.id !== action.value)
        };
      case 'PLAY_SONG':
        return {
          ...state,
          player: {
            ...state.player,
            currentSongId: action.value
          }
        };
      case 'STOP_SONG':
        return {
          ...state,
          player: {
            ...state.player,
            currentSongId: '0'
          }
        };
      case 'RANDOM_SONG':
        const getRandomSongId = (songId) => {
          const randomIndex = ~~(Math.random() * (state.songs.length - 1));
          return state.songs[randomIndex].id !== songId ? state.songs[randomIndex].id : getRandomSongId(songId);
        };
        const nextSongId = getRandomSongId(state.player.currentSongId);
        return {
          ...state,
          player: {
            ...state.player,
            currentSongId: nextSongId
          }
        };
      case 'NEXT_SONG':
        let idx = state.songs.findIndex((song) => song.id === state.player.currentSongId);
        if (idx + 1 <= state.songs.length - 1) {
          idx += 1;
        } else {
          idx = 0;
        }
        return {
          ...state,
          player: {
            ...state.player,
            currentSongId: state.songs[idx].id
          }
        };
      case 'PREV_SONG':
        let pidx = state.songs.findIndex((song) => song.id === state.player.currentSongId);
        if (pidx - 1 >= 0) {
          pidx -= 1;
        } else {
          pidx = state.songs.length - 1;
        }
        return {
          ...state,
          player: {
            ...state.player,
            currentSongId: state.songs[pidx].id
          }
        };
      case 'REPEAT_SONG': {
        return {
          ...state,
          player: {
            ...state.player,
            lastRepeatTime: new Date().getTime()
          }
        };
      }
      case 'CHANGE_SETTING': {
        return {
          ...state,
          setting: {
            ...state.setting,
            ...action.value
          }
        };
      }
      default:
        throw new Error();
    }
  }, initialMediaPlayerState);

  React.useEffect(() => {
    // Remove the current playing state from saved state
    const stateToSave = {
      ...state,
      player: {
        currentSongId: '0'
      }
    };
    window.localStorage.setItem('tubemusic-songs', JSON.stringify(stateToSave));
  }, [state]);

  return <MediaPlayerContext.Provider value={{ state, dispatch }}>{children}</MediaPlayerContext.Provider>;
};
