import * as React from 'react';
import {Fragment} from 'react';
import classnames from 'classnames';

import {MediaPlayerContext} from '~/MediaPlayerState';
import {SVG} from '~/components/svg';
import {ProgressBar} from '~/components/progress-bar';
import {VolumeControl} from "~/components/volume-control";

import {durationDisplay} from '~/lib/utils';
import {API} from '~/lib/api';

import spinnerIcon from '~/img/spinner.svg';
import playIcon from '~/img/play-icon.svg';
import pauseIcon from '~/img/pause-icon.svg';
import prevIcon from '~/img/backward-icon.svg';
import nextIcon from '~/img/forward-icon.svg';
import shuffleIcon from '~/img/shuffle-icon.svg';
import repeatIcon from '~/img/repeat-icon.svg';
import cloudStreamIcon from '~/img/cloud-stream-icon.svg';
import directStreamIcon from '~/img/direct-stream-icon.svg';

export const AudioPlayer = () => {
  const {state, dispatch} = React.useContext(MediaPlayerContext);

  const playerRef = React.useRef<HTMLAudioElement>();
  const currentSongRef = React.useRef<any>();
  const [loading, setLoading] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [songProgress, setSongProgress] = React.useState(0);
  const [duration, setDuration] = React.useState({
    current: 0,
    full: 0
  });

  const nextSongHandler = () => {
    if (state?.setting?.isRandom) {
      dispatch({
        type: 'RANDOM_SONG'
      });
    } else {
      dispatch({
        type: 'NEXT_SONG'
      });
    }
  };

  const prevSongHandler = () => {
    dispatch({
      type: 'PREV_SONG'
    });
  };

  const repeatSongHandler = () => {
    dispatch({type: 'REPEAT_SONG'});
  };

  const changeSettingHandler = (setting: string) => {
    dispatch({type: 'CHANGE_SETTING', value: {[setting]: !state?.setting?.[setting]}});
  };

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

  const onDirectStreamChangedHandler = () => {
    const current = state.directStream || false;
    dispatch({
      type: 'TOGGLE_DIRECT_STREAM',
      value: !current
    })
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
            {
              src: `https://img.youtube.com/vi/${currentSong.id}/0.jpg`,
              sizes: '480x480',
              type: 'image/png'
            }
          ]
        });
      }
    });

    // @ts-ignore
    navigator.mediaSession.setActionHandler('play', function () {
      const player = playerRef.current;
      player.play();
      setPlaying(true);
    });

    // @ts-ignore
    navigator.mediaSession.setActionHandler('pause', function () {
      const player = playerRef.current;
      player.pause();
      setPlaying(false);
    });

    // @ts-ignore
    navigator.mediaSession.setActionHandler('previoustrack', function () {
      prevSongHandler();
    });

    // @ts-ignore
    navigator.mediaSession.setActionHandler('nexttrack', function () {
      nextSongHandler();
    });
  }, []);

  React.useEffect(() => {
    const checkProgress = () => {
      const player = playerRef.current;
      let percent = (player.currentTime / player.duration) * 100;
      setSongProgress(percent);
      setDuration({
        current: player.currentTime,
        full: player.duration
      });
      if (percent === 100) {
        document.title = 'Tubemusic';
        if (state?.setting?.isRepeating) {
          repeatSongHandler();
        } else {
          nextSongHandler();
        }
      }
    };
    playerRef.current.addEventListener('timeupdate', checkProgress);
    return () => {
      playerRef.current.removeEventListener('timeupdate', checkProgress);
    };
  }, [state?.setting]);

  React.useEffect(() => {
    (async () => {
      if (state.player) {
        const current = state.player.currentSongId;
        if (current !== '0') {
          setLoading(true);
          // TODO: Make this independent from state.songs, so we can have PREVIEW_SONG feature
          const song = state.songs.find((song) => song.id === current);
          currentSongRef.current = song;
          document.title = song.title;

          if (playing) {
            playerRef.current.pause();
          }

          let songUrl = `/api/stream?id=${song.id}`;
          if (state.directStream) {
            songUrl = await API.getUrl(song.id);
          }

          playerRef.current.src = songUrl;
          playerRef.current.load();
        }
      }
    })();
  }, [state.player]);

  const songProgressClickHandler = (percent) => {
    if (playing) {
      const player = playerRef.current;
      const duration = player.duration;
      player.currentTime = parseFloat(((duration * percent) / 100).toFixed(2));
    }
  };

  const volumeChangedHandler = (percent) => {
    dispatch({
      type: 'SET_VOLUME',
      value: percent
    })
  };

  React.useEffect(() => {
    const player = playerRef?.current;
    player.volume = (state.volume || 100) / 100;
  }, [state.volume]);

  return (
    <div className="flex flex-col md:flex-row items-center flex-1 p-3 bg-gray-800 border-t border-gray-700">
      {/* Left section */}
      <div className="hidden md:flex flex-row md:w-1/3">
        {currentSongRef.current && (
          <Fragment>
            <div
              className="flex-shrink-0 hidden md:flex md:w-12 md:h-12 mr-3 bg-red-500"
              style={{
                backgroundImage: `url(https://img.youtube.com/vi/${currentSongRef.current?.id}/mqdefault.jpg)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center'
              }}
            />
            <div className="self-center mr-2 text-sm text-white overflow-ellipsis" dangerouslySetInnerHTML={{__html: currentSongRef.current?.title}}></div>
          </Fragment>
        )}
      </div>

      {/* Center section */}
      <div className="w-full md:flex-1 md:flex-grow flex flex-col items-center">
        {/* Control buttons */}
        <div className={"w-full flex flex-row items-center justify-center"}>
          {loading ? (
            <div className="flex-1 mx-5 text-sm text-center">
              <div className="w-5 h-5 mx-auto text-white animate-spin">
                <SVG content={spinnerIcon} />
              </div>
            </div>
          ) : (
            <Fragment>
              <button
            className={classnames(
              'flex items-center justify-center w-6 h-6 mx-2 text-white opacity-75 hover:opacity-100 focus:outline-none',
              {'text-green-500': state?.setting?.isRandom},
              {'text-white': !state?.setting?.isRandom}
            )}
            onClick={() => changeSettingHandler('isRandom')}
          >
            <SVG content={shuffleIcon} />
          </button>
              <button
                className="flex items-center justify-center w-6 h-6 mx-2 text-white opacity-75 hover:opacity-100 focus:outline-none"
                onClick={prevSongHandler}
              >
                <SVG content={prevIcon} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 mx-2 text-white opacity-75 hover:opacity-100 border border-white rounded-full focus:outline-none"
                onClick={playPauseToggle}
              >
                <SVG content={playing ? pauseIcon : playIcon} />
              </button>
              <button
                className="flex items-center justify-center w-6 h-6 mx-2 text-white opacity-75 hover:opacity-100 focus:outline-none"
                onClick={nextSongHandler}
              >
                <SVG content={nextIcon} />
              </button>
              <button
                className={classnames(
                  'flex items-center justify-center w-6 h-6 mx-2 text-white opacity-75 hover:opacity-100 focus:outline-none',
                  {'text-green-500': state?.setting?.isRepeating},
                  {'text-white': !state?.setting?.isRepeating}
                )}
                onClick={() => changeSettingHandler('isRepeating')}
              >
                <SVG content={repeatIcon} />
              </button>
            </Fragment>
          )}
        </div>
        {/* Timeline */}
        <div className={"w-full flex-1 mt-2 flex-shrink-0 flex flex-row items-center justify-around"}>
          <div className="px-3 font-mono text-sm text-center text-gray-500">
            {durationDisplay(duration.current)}
          </div>
          <ProgressBar progress={songProgress} onClick={songProgressClickHandler} />
          <div className="px-3 font-mono text-sm text-center text-gray-500">
            {durationDisplay(duration.full)}
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className={"md:w-1/3 flex flex-row justify-end"}>
        {/* Volume control */}
        <div className={"px-3 mx-3 hidden md:flex"}>
          <VolumeControl
            volume={state.volume || 100}
            onVolumeChanged={volumeChangedHandler}
          />
        </div>

        {/* Direct stream option */}
        <div className="px-3 text-gray-500 mt-3 md:m-0 flex flex-row">
          <button
            className={"text-white opacity-75 hover:opacity-100 w-6 h-6 flex justify-center items-center focus:outline-none"}
            title={state.directStream ? `Direct streaming from Youtube server` : `Stream through Xaudio server`}
            onClick={onDirectStreamChangedHandler}
          >
            <SVG content={state.directStream ? directStreamIcon : cloudStreamIcon} />
          </button>
        </div>
      </div>
    </div>
  );
};
