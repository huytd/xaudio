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
      className="flex-1 h-2 rounded-lg border border-gray-500 mx-5"
      onClick={clickHandler}
    >
      <div className="h-full bg-gray-300" style={{ width: `${progress}%` }}></div>
    </div >
  );
};