import * as React from 'react';
import { Fragment } from 'react';

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

export const AudioPlayer = () => {
  const {state, dispatch} = React.useContext(MediaPlayerContext);

  const playerRef = React.useRef<HTMLAudioElement>();
  const directStreamRef = React.useRef<HTMLInputElement>();
  const currentSongRef = React.useRef<any>();
  const [loading, setLoading] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [songProgress, setSongProgress] = React.useState(0);
  const [duration, setDuration] = React.useState({
    current: 0,
    full: 0
  });

  const nextSongHandler = () => {
    dispatch({
      type: 'NEXT_SONG'
    });
  };

  const prevSongHandler = () => {
    dispatch({
      type: 'PREV_SONG'
    });
  };

  const randomSongHandler = () => {
    dispatch({
      type: 'RANDOM_SONG'
    });
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
    dispatch({
      type: 'TOGGLE_DIRECT_STREAM',
      value: directStreamRef.current?.checked || false
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

    let lastPercent = 0;
    playerRef.current.addEventListener('timeupdate', (e) => {
      const player = playerRef.current;
      let percent = (player.currentTime / player.duration) * 100;
      setSongProgress(percent);
      setDuration({
        current: player.currentTime,
        full: player.duration
      });
      if (~~percent !== lastPercent) {
        if (percent === 100) {
          document.title = 'Xaudio.me';
          nextSongHandler();
        }
        lastPercent = ~~percent;
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
          if (directStreamRef.current.checked) {
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
    <div className="flex flex-row items-center flex-1 p-3 bg-gray-800 border-t border-gray-700">
      {/* Left section */}
      <div className="flex flex-row w-1/3">
        {currentSongRef.current && (
          <Fragment>
            <div
              className="flex-shrink-0 w-12 h-12 mr-3 bg-red-500"
              style={{
                backgroundImage: `url(https://img.youtube.com/vi/${currentSongRef.current?.id}/mqdefault.jpg)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center'
              }}
            />
            <div className="self-center mr-2 text-sm text-white overflow-ellipsis">{currentSongRef.current?.title}</div>
          </Fragment>
        )}
      </div>

      {/* Center section */}
      <div className={"w-1/3 flex flex-col items-center"}>
        {/* Control buttons */}
        <div className={"width-full flex flex-row items-center"}>
          {loading ? (
            <div className="flex-1 mx-5 text-sm text-center">
              <div className="w-5 h-5 mx-auto text-white animate-spin">
                <SVG content={spinnerIcon} />
              </div>
            </div>
          ) : (
            <Fragment>
              <button
                className="flex items-center justify-center w-6 h-6 text-white opacity-75 hover:opacity-100 outline-none"
                onClick={prevSongHandler}
              >
                <SVG content={prevIcon} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 mx-4 text-white opacity-75 hover:opacity-100 border border-white rounded-full outline-none"
                onClick={playPauseToggle}
              >
                <SVG content={playing ? pauseIcon : playIcon} />
              </button>
              <button
                className="flex items-center justify-center w-6 h-6 text-white opacity-75 hover:opacity-100 outline-none"
                onClick={nextSongHandler}
              >
                <SVG content={nextIcon} />
              </button>
            </Fragment>
          )}
        </div>
        {/* Timeline */}
        <div className={"w-full flex-1 mt-2 flex-shrink-0 flex flex-row items-center"}>
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
      <div className={"w-1/3 flex flex-row justify-end"}>
        {/* Volume control */}
        <div className={"px-3 mx-3"}>
          <VolumeControl
            volume={state.volume || 100}
            onVolumeChanged={volumeChangedHandler}
          />
        </div>

        {/* Direct stream option */}
        <div className="px-3 text-gray-500">
          <input
            type="checkbox"
            name="direct-stream"
            id="direct-stream"
            className="mr-2"
            ref={directStreamRef}
            checked={state.directStream || false}
            onChange={onDirectStreamChangedHandler}
          />
          <label htmlFor="direct-stream" title="Select this option if you experienced slow connection issue">Direct Stream</label>
        </div>
      </div>
    </div>
  );
};