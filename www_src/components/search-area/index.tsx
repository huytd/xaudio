import * as React from 'react';
import classnames from 'classnames';

import {MediaPlayerContext} from '~/context';
import {SVG} from '~/components/svg';
import {API} from '~/lib/api';

import spinnerIcon from '~/img/spinner.svg';
import searchIcon from '~/img/search.svg';
import plusIcon from '~/img/plus.svg';
import checkIcon from '~/img/check.svg';
import closeIcon from '~/img/delete.svg';

export const SearchEntries = ({ items }) => {
  const { state, dispatch } = React.useContext(MediaPlayerContext);

  const addSongHandler = ({ title, id, uploader }) => {
    dispatch({
      type: 'ADD_SONG',
      value: { title, id, uploader, listenCount: 0 }
    });
  };

  const previewSongHandler = ({ title, id, uploader }) => {
    dispatch({
      type: 'PREVIEW_SONG',
      value: { title, id, uploader }
    });
  };

  const shouldDisabled = (item) => {
    const found = state.songs.find((s) => s.id === item.id);
    return found !== undefined;
  };

  return items.map((item, i) => {
    const disabled = shouldDisabled(item);
    return (
      <li
        key={i}
        className={classnames('group p-3 border-b border-gray-700 flex flex-row cursor-pointer hover:bg-gray-800', {
          'opacity-25 pointer-events-none': disabled
        })}
      >
        <div
          onClick={() => addSongHandler(item)}
          className={classnames(
            'w-8 h-8 mr-2 flex items-center justify-center flex-shrink-0',
            { 'text-white hover:text-green-500': !disabled },
            { 'text-gray-600': disabled }
          )}
        >
          <SVG content={disabled ? checkIcon : plusIcon} />
        </div>
        <div
          className="w-10 h-10 mr-2 bg-gray-900"
          style={{
            backgroundImage: `url(https://img.youtube.com/vi/${item.id}/mqdefault.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center'
          }}
        />
        <div
          className="items-center flex-1"
          onClick={() => previewSongHandler(item)}
        >
          <div className="text-sm md:text-base text-white pr-2 md:p-0">{item.title}</div>
          <div className="flex flex-row text-sm text-gray-500">
            <div className="flex-1 text-left">{item.uploader}</div>
            <div className="flex-1 font-medium text-right"/>
          </div>
        </div>
      </li>
    );
  });
};

export const SearchArea = ({ toggleSearchHandler }) => {
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
    <div id="search-area" className="flex flex-col w-full md:w-3/12 bg-gray-800 border-l border-gray-700 shadow-lg opacity-80">
      <div className="px-3 py-2 border-b border-gray-700 text-white">
        <div className="m-0 text-bold">Search</div>
        <button
          className={
            'text-white opacity-50 hover:opacity-100 flex flex-row items-center absolute top-0 right-0 p-2 focus:outline-none'
          }
          onClick={toggleSearchHandler}
        >
          <SVG content={closeIcon} />
        </button>
      </div>
      <div className="flex flex-row items-center flex-shrink-0 px-4 py-2 m-3 text-white bg-gray-600 rounded-full">
        <div className="flex-shrink-0 mr-3">
          <SVG content={searchIcon} />
        </div>
        <input
          className="flex-1 text-white bg-gray-600 focus:outline-none"
          ref={searchInputRef}
          type="text"
          placeholder="Search by song title or artist..."
          onKeyPress={keyPressHandler} />
      </div>
      {loading ? (
        <div className="w-5 h-5 mx-auto my-5 text-white animate-spin">
          <SVG content={spinnerIcon} />
        </div>
      ) : (
          <div className="relative flex-1 overflow-hidden">
            <ul className="absolute top-0 bottom-0 left-0 right-0 overflow-y-scroll" style={{ right: -17 }}>
              <SearchEntries items={searchResult} />
            </ul>
          </div>
        )}
    </div>
  );
};