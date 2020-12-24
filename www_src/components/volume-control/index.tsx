import * as React from 'react';
import { useEffect, useState, useRef } from 'react'

import {SVG} from '~/components/svg';
import {ProgressBar} from '~/components/progress-bar';

import volumeLowIcon from '~/img/volume-low-icon.svg';
import volumeFullIcon from '~/img/volume-full-icon.svg';
import volumeMuteIcon from '~/img/volume-mute-icon.svg';
import {execute} from "~/lib/utils";

export const VolumeControl = ({ volume, onVolumeChanged = undefined }) => {
  const [percent, setPercent] = useState(volume);
  const lastVolume = useRef(percent);

  const handleVolumeChange = (percent) => {
    setPercent(percent);
  };

  const getVolumeIcon = () => {
    if (percent > 50) {
      return volumeFullIcon;
    } else if (percent > 0) {
      return volumeLowIcon;
    } else {
      return volumeMuteIcon;
    }
  };

  const toggleMute = () => {
    if (percent !== 0) {
      lastVolume.current = percent;
      setPercent(0);
    } else {
      setPercent(lastVolume.current);
    }
  };

  useEffect(() => {
    execute(onVolumeChanged, percent);
  }, [percent]);

  return (
    <div className="flex flex-row items-center w-48 text-white">
      <SVG
        className={"cursor-pointer opacity-50 hover:opacity-100"}
        content={getVolumeIcon()}
        onClick={toggleMute}
      />
      <ProgressBar
        progress={percent}
        onClick={handleVolumeChange}
      />
    </div>
  )
};