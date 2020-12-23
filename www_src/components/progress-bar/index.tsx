import * as React from 'react';
import { execute } from '~/lib/utils';

export const ProgressBar = ({ progress = 0, onClick = undefined }) => {
  const clickHandler = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.floor(x / rect.width * 100);
    execute(onClick, percent);
  };

  return (
    <div
      className="flex-1 h-2 mx-5 border border-gray-500 rounded-lg"
      onClick={clickHandler}
    >
      <div className="h-full bg-gray-300" style={{pointerEvents: 'none', width: `${progress}%`}}/>
    </div >
  );
};
