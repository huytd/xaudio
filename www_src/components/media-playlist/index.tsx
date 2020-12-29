import * as React from 'react';
import classnames from 'classnames';
import {ReactSortable} from 'react-sortablejs';

import {MediaPlayerContext, SongState} from '~/context';
import {SVG} from '~/components/svg';

import deleteIcon from '~/img/delete.svg';

export const MediaPlaylist = () => {
  const {state, dispatch} = React.useContext(MediaPlayerContext);

  const playClickHandler = (song) => {
    dispatch({
      type: 'PLAY_SONG',
      value: song
    });
  };

  const deleteClickHandler = (song: SongState) => {
    dispatch({
      type: 'REMOVE_SONG',
      value: song.id
    });
  };

  const sortPlaylistHandler = (playlist) => {
    dispatch({
      type: 'SORT_PLAYLIST',
      value: playlist
    });
  };

  const albumCovers = state.songs.slice(0, 4).map(song => song.id);

  return (
    <div className="absolute top-0 bottom-0 left-0 right-0 overflow-y-scroll" style={{left: 10, right: -17}}>
      <div className={"p-5 my-5 text-white flex flex-row items-end"}>
        <div className={"w-24 h-24 md:w-48 md:h-48 bg-white rounded-lg mr-5 flex flex-row flex-wrap overflow-hidden"}>
          {albumCovers.map(id => (
            <div
              key={`album-cover-${id}`}
              className={"w-12 h-12 md:w-24 md:h-24"}
              style={{
                backgroundImage: `url(https://img.youtube.com/vi/${id}/mqdefault.jpg)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center'
              }}
            />
          ))}
        </div>
        <div>
          <div className={"uppercase text-sm"}>playlist</div>
          <h1 className="text-3xl md:text-7xl font-bold">Now Playing</h1>
          <div className="text-sm opacity-50">{state.songs.length} songs</div>
        </div>
      </div>
      <ReactSortable list={state.songs} setList={sortPlaylistHandler}>
        {state.songs.map((song, i) => {
          const isCurrent = state.player?.currentSong?.id === song.id;
          return (
            <div
              key={song.id}
              className={classnames(
                'group grid grid-cols-10 border-b border-gray-800 cursor-pointer hover:bg-gray-800',
                'items-center',
                {'text-green-500': isCurrent},
                {'text-gray-300': !isCurrent}
              )}
            >
              <div className="flex flex-row items-start md:items-center p-2 col-span-8 md:col-span-6" onClick={() => playClickHandler(song)}>
                <div className="items-center justify-center flex-shrink-0 w-8 h-6 mr-2 text-center text-gray-700">
                  {i + 1}
                </div>
                <div
                  className="w-10 h-10 mr-2 bg-gray-900"
                  style={{
                    backgroundImage: `url(https://img.youtube.com/vi/${song.id}/mqdefault.jpg)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center'
                  }} />
                <div className="flex-1 hover:text-green-200 text-sm md:text-base">{song.title}</div>
              </div>
              <div className="p-2 col-span-2 opacity-60 hidden md:block">{song.uploader}</div>
              <div className="p-2 col-span-1"/>
              <div className="p-2 col-span-1">
                <button
                  className={classnames(
                    'w-8 h-8 flex float-right mx-5 items-center justify-center text-white opacity-10 hover:opacity-100 hover:text-red-500'
                  )}
                  onClick={() => deleteClickHandler(song)}
                >
                  <SVG content={deleteIcon} />
                </button>
              </div>
            </div>
          );
        })}
      </ReactSortable>
    </div>
  );
};