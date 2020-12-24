import * as React from 'react';
import classnames from 'classnames';

export const SVG = ({ className = undefined, content, onClick = undefined }) => {
  return (
    <div className={classnames("svg-wrapper", className)} dangerouslySetInnerHTML={{__html: content}} onClick={onClick} />
  );
};