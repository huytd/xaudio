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
    currentSongId: string;
  };
}
interface Action {
  type: string;
  value?: any;
}
const savedState = window.localStorage.getItem('tubemusic-songs');
const initialMediaPlayerState = savedState ? JSON.parse(savedState) : templateState;

export const MediaPlayerContext = React.createContext({
  state: initialMediaPlayerState,
  dispatch: null
});
export const MediaPlayerStateProvider = ({children}) => {
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
            currentSongId: action.value
          }
        };
      case 'PREVIEW_SONG':
        // TODO: Nothing here yet, need to wait for Audio Player refactor
        return {
          ...state,
        };
      case 'STOP_SONG':
        return {
          ...state,
          player: {
            currentSongId: '0'
          }
        };
      case 'RANDOM_SONG':
        let randomIndex = ~~(Math.random() * (state.songs.length - 1));
        return {
          ...state,
          player: {
            currentSongId: state.songs[randomIndex].id
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
            currentSongId: state.songs[pidx].id
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
        currentSongId: '0'
      }
    };
    window.localStorage.setItem('tubemusic-songs', JSON.stringify(stateToSave));
  }, [state]);

  return <MediaPlayerContext.Provider value={{state, dispatch}}>{children}</MediaPlayerContext.Provider>;
};

