use std::process::Command;
use std::env;

fn stringify_error(e: impl std::fmt::Debug + std::fmt::Display) -> String {
    format!("{}", e)
}

#[derive(Default, Debug, Clone, PartialEq, serde_derive::Serialize, serde_derive::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YoutubeSearchResult {
    pub kind: String,
    pub etag: String,
    pub next_page_token: String,
    pub region_code: String,
    pub page_info: PageInfo,
    pub items: Vec<Item>,
}

#[derive(Default, Debug, Clone, PartialEq, serde_derive::Serialize, serde_derive::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PageInfo {
    pub total_results: i64,
    pub results_per_page: i64,
}

#[derive(Default, Debug, Clone, PartialEq, serde_derive::Serialize, serde_derive::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub id: Id,
    pub snippet: Option<Snippet>,
}

#[derive(Default, Debug, Clone, PartialEq, serde_derive::Serialize, serde_derive::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Id {
    pub kind: String,
    pub video_id: String,
}

#[derive(Default, Debug, Clone, PartialEq, serde_derive::Serialize, serde_derive::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Snippet {
    pub title: String,
    pub description: String,
    pub channel_title: String,
}

#[derive(Default, Debug, Clone, PartialEq, serde_derive::Serialize, serde_derive::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Playlist {
    pub entries: Vec<PlaylistEntry>,
}

#[derive(Default, Debug, Clone, PartialEq, serde_derive::Serialize, serde_derive::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistEntry {
    pub id: String,
    pub title: String,
    pub uploader: String,
    pub extractor: String,
}

#[derive(Default, Debug, Clone, serde_derive::Serialize, serde_derive::Deserialize)]
pub struct SearchEntry {
    pub title: String,
    pub uploader: String,
    pub id: String
}

pub async fn search_song(input: &str) -> Result<Vec<SearchEntry>, String> {
    let key = env::var("YOUTUBE_API_KEY").map_err(stringify_error)?;
    let url = format!("https://youtube.googleapis.com/youtube/v3/search?part=snippet&order=relevance&q={}&type=video&key={}&maxResults=50", input, key);
    let response = reqwest::get(&url).await.map_err(stringify_error)?;
    if let Ok(result) = response.json::<YoutubeSearchResult>().await {
        let entries = result.items.into_iter().filter(|item| item.snippet.is_some()).map(|item| {
            let snippet = item.snippet.unwrap();
            SearchEntry {
                title: snippet.title.to_owned(),
                uploader: snippet.channel_title.to_owned(),
                id: item.id.video_id.to_owned()
            }
        }).collect();
        return Ok(entries);
    }
    Ok(vec![])
}

pub async fn get_song_stream(url: &str) -> Result<reqwest::Response, String> {
    reqwest::get(url).await.map_err(stringify_error)
}

pub fn get_song_url(id: &str) -> Result<String, String> {
    let url = format!("https://youtube.com/watch?v={}", id);
    println!("DBG::FETCHING {}", url);
    let output = Command::new("youtube-dl")
    .arg("--get-url")
    .arg("-f bestaudio")
    .arg(url)
    .output().map_err(stringify_error)?;
    let stdout = String::from_utf8(output.stdout).map_err(stringify_error)?;
    let stderr = String::from_utf8(output.stderr).map_err(stringify_error)?;
    println!("DBG::STDOUT {}", stdout);
    println!("DBG::STDERR {}", stderr);
    Ok(stdout.replace("\n", ""))
}

pub fn get_songs_in_playlist(playlist_url: &str) -> Result<Playlist, String> {
    let output = Command::new("youtube-dl")
    .arg("-J")
    .arg(playlist_url)
    .output()
    .map_err(stringify_error)?;
    let stdout = String::from_utf8(output.stdout).map_err(stringify_error)?;
    if let Ok(parsed ) = serde_json::from_str::<Playlist>(&stdout).map_err(stringify_error) {
        return Ok(parsed);
    }
    if let Ok(parsed) = serde_json::from_str::<PlaylistEntry>(&stdout).map_err(stringify_error) {
        return Ok(Playlist {
            entries: vec![parsed]
        });
    }
    return Err("Error parsing data".to_owned());
}


pub async fn similar_songs(id: &str) -> Result<Vec<SearchEntry>, String> {
    let key = env::var("YOUTUBE_API_KEY").map_err(stringify_error)?;
    let url = format!("https://youtube.googleapis.com/youtube/v3/search?part=snippet&order=relevance&type=video&key={}&maxResults=30&relatedToVideoId={}", key, id);
    println!("API CALL {}", url);
    let response = reqwest::get(&url).await.map_err(stringify_error)?;
    if let Ok(result) = response.json::<YoutubeSearchResult>().await {
        println!("GOT {} items", result.items.len());
        let entries = result.items.into_iter().filter(|item| item.snippet.is_some()).map(|item| {
            let snippet = item.snippet.unwrap();
            SearchEntry {
                title: snippet.title.to_owned(),
                uploader: snippet.channel_title.to_owned(),
                id: item.id.video_id.to_owned()
            }
        }).collect();
        return Ok(entries);
    }
    Ok(vec![])
}