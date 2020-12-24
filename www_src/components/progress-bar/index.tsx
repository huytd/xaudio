import * as React from 'react';
import { execute } from '~/lib/utils';

const WHEEL_CHANGE_PERCENT = 10;

export const ProgressBar = ({ progress = 0, onClick = undefined }) => {
  const progressChangeHandler = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.floor(x / rect.width * 100);
    execute(onClick, percent);
  };

  const progressChangeByWheelHandler = (e) => {
    let delta = 1;
    if (e.deltaY > 0) {
      delta = 1;
    } else {
      delta = -1;
    }
    const newPercent = Math.min(Math.max(progress + delta * WHEEL_CHANGE_PERCENT, 0), 100);
    execute(onClick, newPercent);
  };

  return (
    <div
      className="flex-1 h-1 mx-5 bg-gray-600 rounded-lg overflow-hidden"
      onMouseDown={progressChangeHandler}
      onWheel={progressChangeByWheelHandler}
    >
      <div className="h-full bg-gray-200" style={{pointerEvents: 'none', width: `${progress}%`}}/>
    </div >
  );
};
