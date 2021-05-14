import axios from 'axios';

const CACHE_KEY = '__xaudio_cached_data';
const CACHE_EXPIRE = 24 * 60 * 60 * 1000;

const slugify = string => {
  const a = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;'
  const b = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')
  return string.toString().toLowerCase()
    .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
    .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
    .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
    .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
    .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
    .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
    .replace(/đ/gi, 'd')
    .replace(/\s+/g, '-')
    .replace(p, c => b.charAt(a.indexOf(c)))
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
};

const getCache = (action, query) => {
  const key = `${action}-${slugify(query)}`;
  const cache = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "{}");
  const found = cache[key];
  if (found) {
    const timeSinceLastWrite = Date.now() - (found.lastWrite || 0);
    if (timeSinceLastWrite < CACHE_EXPIRE) {
      return found.data;
    }
  }
  return null;
};

const writeCache = (action, query, data) => {
  const key = `${action}-${slugify(query)}`;
  const cache = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "{}");
  cache[key] = {
    lastWrite: Date.now(),
    data
  };
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

const queryData = async (action, query) => {
  const found = getCache(action, query);
  if (found) {
    return found;
  } else {
    const result = await axios.get(`/api/${action}?query=${query}`);
    if (result?.data) {
      writeCache(action, query, result.data);
      return result.data;
    }
  }
};

export const API = {
  getSimilarSongs: async (query) => {
    return await queryData('suggestion', query);
  },
  search: async (query) => {
    return await queryData('search', query);
  },
  getUrl: async (song) => {
    const result = await axios.get(`/api/play?id=${song}`);
    return result?.data?.url || `/api/stream?id=${song}`;
  },
  getPlaylist: async (id) => {
    const result = await axios.get(`/api/session/${id}`);
    return result?.data?.entries || [];
  },
  savePlaylist: async (entries) => {
    const payload = {
      entries: entries
    };
    return await axios.post(`/api/session/new`, payload);
  }
};
