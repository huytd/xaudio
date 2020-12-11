use std::time::{SystemTime, Duration};

use csv::Reader;

static mut CACHED_DATA: Option<(String, SystemTime)> = None;
const ONE_DAY: u64 = 24 * 60 * 60;

#[derive(Debug, serde_derive::Serialize, serde_derive::Deserialize)]
pub struct Song {
    pub title: String,
    pub artist: String
}

fn is_cached() -> bool {
    unsafe {
        let cache = CACHED_DATA.to_owned().unwrap_or((format!(""), SystemTime::now()));
        let last_cached = SystemTime::now().duration_since(cache.1).unwrap_or(Duration::from_secs(0));
        if last_cached.as_secs() >= ONE_DAY || cache.0.len() <= 0 {
            return false;
        }
    }
    return true;
}

fn write_cache(data: &str) {
    unsafe {
        CACHED_DATA = Some((data.to_owned(), SystemTime::now()));
    }
}

fn read_cache() -> Option<String> {
    if is_cached() {
        unsafe {
            let cache = CACHED_DATA.to_owned().unwrap_or((format!(""), SystemTime::now()));
            return Some(cache.0);
        }
    }
    None
}

pub async fn get_top_songs() -> Result<Vec<Song>, bool> {
    let mut cache_need_write = false;
    let cached_data = read_cache();
    let data = if cached_data.is_some() {
        println!("Read from cache");
        cached_data.unwrap()
    } else {
        cache_need_write = true;
        println!("Downloading");
        reqwest::get("https://spotifycharts.com/regional/vn/daily/latest/download")
        .await.map_err(|_| false)?
        .text().await.map_err(|_| false)?
    };

    if cache_need_write {
        write_cache(data.as_str());
    }

    let mut songs = vec![];
    let mut reader = Reader::from_reader(data.as_bytes());
    let records = reader.records().skip(1);
    for result in records {
        let record = result.map_err(|_| false)?;
        songs.push(Song {
            title: record[1].to_owned(),
            artist: record[2].to_owned()
        });
    }
    Ok(songs)
}

#[actix_rt::test]
async fn test_get_top_song() {
    println!("First Test {}", is_cached());
    let _ = get_top_songs().await;
    println!("Second Test {}", is_cached());
    let _ = get_top_songs().await;
    println!("Third Test {}", is_cached());
    let _ = get_top_songs().await;
}

