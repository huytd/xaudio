import * as React from 'react';
import templateState from '~/data/template-playlist.json';
import { queryParams } from '~/lib/utils';

export interface SongState {
  id: string;
  title: string;
  uploader: string;
  listenCount?: number;
}

interface MediaPlayerState {
  songs: SongState[];
  player: {
    currentSong?: {
      id: string;
      title: string;
    } | undefined;
  };
  setting?: {
    isRepeating?: boolean;
    isRandom?: boolean;
  };
  volume?: number
  cloudStream?: boolean,
  forceSave?: boolean
}
interface Action {
  type: string;
  value?: any;
}

type ContextProps = {
  state: MediaPlayerState;
  dispatch: React.Dispatch<any>;
};

const readOnlyMode = queryParams("readOnly") || queryParams("playlist") || false;
const savedState = window.localStorage.getItem('tubemusic-songs');
const initialMediaPlayerState = !readOnlyMode && savedState ? JSON.parse(savedState) : templateState;

export const MediaPlayerContext = React.createContext<ContextProps>({
  state: initialMediaPlayerState,
  dispatch: null
});
export const MediaPlayerStateProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer((state: MediaPlayerState, action: Action) => {
    switch (action.type) {
      case 'LOAD_PLAYLIST':
        return {
          ...state,
          songs: action.value
        };
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
            currentSong: action.value
          }
        };
      case 'STOP_SONG':
        return {
          ...state,
          player: {
            ...state.player,
            currentSong: undefined
          }
        };
      case 'RANDOM_SONG':
        const getRandomSong = (song) => {
          const randomIndex = ~~(Math.random() * (state.songs.length - 1));
          return state.songs[randomIndex].id !== song?.id ? state.songs[randomIndex] : getRandomSong(song);
        };
        const nextSong = getRandomSong(state.player.currentSong);
        return {
          ...state,
          player: {
            ...state.player,
            currentSong: nextSong
          }
        };
      case 'NEXT_SONG':
        let idx = state.songs.findIndex((song) => song.id === state.player?.currentSong?.id) || 0;
        if (idx + 1 <= state.songs.length - 1) {
          idx += 1;
        } else {
          idx = 0;
        }
        return {
          ...state,
          player: {
            ...state.player,
            currentSong: state.songs[idx]
          }
        };
      case 'PREV_SONG':
        let pidx = state.songs.findIndex((song) => song.id === state.player?.currentSong?.id) || 0;
        if (pidx - 1 >= 0) {
          pidx -= 1;
        } else {
          pidx = state.songs.length - 1;
        }
        return {
          ...state,
          player: {
            ...state.player,
            currentSong: state.songs[pidx]
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
      case 'TOGGLE_CLOUD_STREAM':
        return {
          ...state,
          cloudStream: action.value
        };
      case 'SET_VOLUME':
        return {
          ...state,
          volume: action.value
        };
      case 'FORCE_SAVE':
        return {
          ...state,
          forceSave: true
        };
      default:
        throw new Error();
    }
  }, initialMediaPlayerState);

  React.useEffect(() => {
    if (!readOnlyMode || state.forceSave) {
      // Remove the current playing state from saved state
      const stateToSave = {
        ...state,
        forceSave: undefined,
        player: {
          currentSong: undefined
        }
      };
      window.localStorage.setItem('tubemusic-songs', JSON.stringify(stateToSave));
    }
  }, [state]);

  return <MediaPlayerContext.Provider value={{ state, dispatch }}>{children}</MediaPlayerContext.Provider>;
};
