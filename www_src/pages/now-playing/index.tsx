import * as React from 'react';
import { Fragment } from 'react';
import { MediaPlaylist } from '../../components/media-playlist';
import { DrawerArea } from '../../components/search-area';
import { SVG } from '~/components/svg';
import searchIcon from '~/img/search.svg';
import { MediaPlayerContext } from '~/context';

export const NowPlayingPage = () => {
  const {state} = React.useContext(MediaPlayerContext);
  const [showDrawer, setShowDrawer] = React.useState(false);

  const toggleDrawerHandler = () => {
    setShowDrawer(!showDrawer);
  };

  return state.errorMessage ? (
    <div className={"flex-1 flex flex-row"} style={{background: "rgba(0, 0, 0, 0.15)"}}>
      <div className="m-5 flex justify-center items-center w-full h-full text-white">
        <div className="text-lg">{state.errorMessage}</div>
      </div>
    </div>
  ) : (
    <div className={"flex-1 flex flex-row"} style={{background: "rgba(0, 0, 0, 0.15)"}}>
      {/* Playlist */}
      <div className="relative flex flex-row flex-1 pl-2 overflow-hidden">
        <MediaPlaylist />
        {!showDrawer ? (
          <button
            className={"text-white opacity-50 hover:opacity-100 flex flex-row items-center absolute top-0 right-0 m-5 focus:outline-none"}
            onClick={toggleDrawerHandler}
          >
            <SVG content={searchIcon} className={'mr-2'} />
            <span className={"hidden md:block"}>Explore</span>
          </button>
        ) : null}
      </div>
      <DrawerArea isOpen={showDrawer} toggleDrawerHandler={toggleDrawerHandler} />
    </div>
  );
};
