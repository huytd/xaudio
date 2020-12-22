export const execute = (fn, ...params) => {
  if(typeof(fn) === "function"){
    return fn.call(this, ...params);
  }
  return fn;
};

export const pad = n => (n > 9 ? `${n}` : `0${n}`);

export const durationDisplay = counter => {
  const days = ~~(counter / 86400);
  const remain = counter - days * 86400;
  const hrs = ~~(remain / 3600);
  const min = ~~((remain - hrs * 3600) / 60);
  const sec = ~~(remain % 60);
  return `${hrs > 0 ? pad(hrs) + ':' : ''}${pad(min)}:${pad(sec)}`;
};

export const arrayMove = (arr, from, to) => {
  const el = arr.splice(from, 1);
  const left = arr.splice(0, to);
  const right = arr;
  return [].concat(left, el, right);
};
