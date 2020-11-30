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
    pub snippet: Snippet,
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
        let entries = result.items.into_iter().map(|item| {
            SearchEntry {
                title: item.snippet.title.to_owned(),
                uploader: item.snippet.channel_title.to_owned(),
                id: item.id.video_id.to_owned()
            }
        }).collect();
        return Ok(entries);
    }
    Ok(vec![])
}

pub fn get_song_url(id: &str) -> Result<String, String> {
    let url = format!("https://youtube.com/watch?v={}", id);
    let output = Command::new("youtube-dl")
    .arg("--get-url")
    .arg("--extract-audio")
    .arg("--audio-format=mp3")
    .arg("--audio-quality=0")
    .arg(url)
    .output()
    .map_err(stringify_error)?;
    let stdout = String::from_utf8(output.stdout).map_err(stringify_error)?;
    Ok(stdout.replace("\n", ""))
}

pub fn get_songs_in_playlist(playlist_url: &str) -> Result<Playlist, String> {
    let output = Command::new("youtube-dl")
    .arg("-J")
    .arg(playlist_url)
    .output()
    .map_err(stringify_error)?;
    let stdout = String::from_utf8(output.stdout).map_err(stringify_error)?;
    // TODO: Look like it returning a single entry only
    // The reason seems to be: with the input URL like this:
    //  http://localhost:3123/api/import?url=https://www.youtube.com/watch?v=hOFK6vcKVJ4&list=PLxKLMN7WdG5Bov8ViLgsNXe6aIiQm96M_
    // the list param does not get recognized, so it treated this as a single video
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